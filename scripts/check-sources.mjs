#!/usr/bin/env node
/**
 * check-sources.mjs — les sources officielles citées répondent-elles encore ? (RECETTE-SITE.md §17.4)
 *
 * Lit toutes les URL externes du code source (paramètres, pages, composants — hors schema.org, polices,
 * outils Google/Bing, réseaux sociaux, exemples) et les ouvre une à une.
 * Échoue sur les liens MORTS : 404, 410, ou page « introuvable » servie avec un code 200 (le SEPE
 * répond 200 avec « No encontrada »). Signale sans bloquer les liens INJOIGNABLES (5xx, connexion
 * refusée, délai : panne du serveur, pas du lien — le SEPE était en 503 le 2026-09-18) et BLOQUÉS
 * aux robots (403, 429) : à revérifier à la main avant de conclure.
 *
 * Ne sont vérifiées que les URL CITÉES (RECETTE §26, 2026-10-16) : les fichiers de données
 * portent aussi des points d'appel d'API (« const API_BASE = 'https://api.…' », fetch(…)),
 * dont la racine répond 404 ou 401 sans que rien ne soit mort. Sont donc écartés :
 *   - une URL lue en contexte de code (fetch(, new URL(, identifiant *api* / *base* /
 *     *endpoint* / *host* qui reçoit l'URL) ou suivie d'une concaténation (+, ${…}) ;
 *   - les racines d'API déclarées dans scripts/api-racines.txt (un préfixe par ligne,
 *     précédé d'un commentaire qui dit ce que le site appelle) ;
 *   - le domaine du site lui-même (SITE_URL de src/data/site-config.ts, public/CNAME),
 *     pas encore en ligne pendant la construction : il ressortait « injoignable ».
 *
 * Usage : node check-sources.mjs <dossier-du-site>   → code 1 si une source est morte.
 *         node check-sources.mjs <dossier-du-site> --liste   → liste les URL retenues, sans réseau.
 */
import { readdir, readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);
const UA = 'RadifPartnersFactCheck/1.0 (check-sources; site reference check)';

const site = process.argv[2];
if (!site) { console.error('usage: check-sources.mjs <site-dir>'); process.exit(2); }

async function* walk(d) {
  for (const e of await readdir(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    // `scripts` est exclu : les controleurs portent dans leur propre texte
    // d'usage des URL d'exemple (« https://domaine », « http://x ») qui
    // ressortaient comme des sources mortes du site. Un controle qui signale
    // ses propres lignes d'aide apprend a ignorer ses avertissements.
    // Réponses brutes d'API mises en cache ou en échantillon (cache, raw, brut, samples, fixtures) :
    // les URL qu'elles contiennent viennent de l'API, le site ne les cite pas (vin-decoder, 2026-10-16).
    if (e.isDirectory()) { if (!/node_modules|dist|out|_archives|scripts|\.astro|\.git|^(cache|raw|brut|samples?|fixtures|__fixtures__|snapshots?)$/.test(e.name)) yield* walk(p); }
    else if (/[.-](raw|brut|sample|samples|cache)\.json$/.test(e.name)) continue;
    // Le HTML compte : un site écrit à la main n'a ni .astro ni .tsx, et ses
    // sources officielles ne vivent que là. Sans cette extension, le contrôle
    // annonçait « 0 source » sur netsalaire.com — un échec déguisé en succès.
    // `package-lock.json` ne contient que des archives npm : des centaines d'URL
    // qui ne sont pas des sources et noient le résultat.
    else if (/^package-lock\.json$/.test(e.name)) continue;
    else if (/\.(json|ts|tsx|astro|mjs|html)$/.test(e.name)) yield p;
  }
}
const urls = new Set();
// clarity.ms et formspree.io ne sont pas des sources : l'un est une balise de
// mesure, l'autre un point d'envoi de formulaire qui refuse le GET (405).
const IGNORE = /(schema\.org|w3\.org|clarity\.ms|formspree\.io|googletagmanager|google-analytics|googleapis|gstatic|google\.com|bing\.com|indexnow|fonts\.|example\.|localhost|127\.0\.0\.1|twitter\.com|x\.com|facebook\.com|linkedin\.com|wa\.me|mailto:|\$\{)/;
// Astro et Next rangent leurs sources dans `src` ; un site écrit à la main a ses
// pages à la racine. On parcourt la racine dans tous les cas : `src` en fait
// partie, et un `src` réduit à une feuille de style ne prouve rien.
const lireSiExiste = (p) => { try { return readFileSync(p, 'utf8'); } catch { return ''; } };
// Domaine du site : le nom du dossier (ancienne règle) ne suffit pas, couleur-tempo sert tempodemain.fr.
const siens = new Set([basename(resolve(site))]);
const cfgSite = lireSiExiste(join(site, 'src', 'data', 'site-config.ts'));
const mUrl = cfgSite.match(/SITE_URL\s*=\s*['"]https?:\/\/([^'"/]+)/);
if (mUrl) siens.add(mUrl[1].replace(/^www\./, ''));
for (const c of [join(site, 'public', 'CNAME'), join(site, 'CNAME')]) { const d = lireSiExiste(c).trim(); if (d) siens.add(d.replace(/^www\./, '')); }
const hoteDe = (u) => { try { return new URL(u).host.replace(/^www\./, ''); } catch { return ''; } };
// Racines d'API déclarées par le site (scripts/api-racines.txt), un préfixe d'URL par ligne.
const racinesApi = lireSiExiste(join(site, 'scripts', 'api-racines.txt')).split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
// Contexte de code : l'URL est un point d'appel, pas une source citée.
const CODE_AVANT = /(fetch\s*\(\s*|new\s+URL\s*\(\s*|axios(\.\w+)?\s*\(\s*|\b\w*(api|base|endpoint|host)\w*['"]?\s*[:=]\s*)[`'"]$/i;
const CONCAT_APRES = /^[`'"]?\s*\+|^\$\{|^`\s*\+/;
const ecartees = [];
// Constante qui reçoit une URL puis sert de base à des concaténations ailleurs (`${VPIC}/Decode…`) :
// c'est une racine d'API, jugée une fois tous les fichiers lus.
const CONST_AVANT = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::\s*[\w<>[\]]+)?\s*=\s*[`'"]$/;
const candidates = []; const textes = [];
for await (const f of walk(site)) {
  const txt = await readFile(f, 'utf8'); textes.push(txt);
  for (const m of txt.matchAll(/https?:\/\/[^"'`\s)<>]+/g)) {
    const u = m[0].replace(/&(quot|#34|#39|apos);?.*$/, '').replace(/#.*$/, '').replace(/[.,;]+$/, '');
    if (IGNORE.test(u) || siens.has(hoteDe(u)) || [...siens].some((d) => d && u.includes('//' + d))) continue;
    const debutLigne = txt.lastIndexOf('\n', m.index) + 1;
    const avant = txt.slice(Math.max(debutLigne, m.index - 120), m.index);
    const apres = txt.slice(m.index + m[0].length, m.index + m[0].length + 6);
    if (racinesApi.some((r) => u.startsWith(r)) || CODE_AVANT.test(avant) || CONCAT_APRES.test(apres)) { ecartees.push(u); continue; }
    const c = avant.match(CONST_AVANT);
    if (c) candidates.push([c[1], u]);
    urls.add(u);
  }
}
const tout = textes.join('\n');
for (const [nom, u] of candidates) {
  const n = nom.replace(/\$/g, '\\$');
  if (new RegExp('\\$\\{' + n + '\\}|\\b' + n + '\\s*\\+\\s*[`\'"]').test(tout)) { urls.delete(u); ecartees.push(u); }
}
if (process.argv.includes('--liste')) {
  console.log(`check-sources --liste : ${urls.size} source(s) retenue(s), ${new Set(ecartees).size} point(s) d'appel d'API écarté(s)`);
  [...urls].sort().forEach((u) => console.log('  + ' + u)); [...new Set(ecartees)].sort().forEach((u) => console.log('  - ' + u));
  process.exit(0);
}

const NOT_FOUND = /(page not found|no encontrada|página no encontrada|pagina niet gevonden|seite nicht gefunden|page introuvable|404 not found|error 404)/i;
const dead = [], blocked = [], down = [];
// 6 requêtes à la fois et un second essai : lancées toutes ensemble, l'ASPCA, le RHS ou
// Missouri Botanical Garden coupaient des connexions et une source vivante passait pour
// injoignable (plantcare101.com, 2026-10-04 : de 6 à 51 « injoignables » selon l'essai, 0 en réalité).
const check = async (u, essai = 1) => {
  try {
    const r = await fetch(u, { redirect: 'follow', signal: AbortSignal.timeout(30000), headers: { 'user-agent': UA } });
    const body = r.ok ? (await r.text()).slice(0, 4000) : '';
    // 429 : le serveur limite la cadence (Clemson HGIC) ; on patiente puis on réessaie une fois.
    if (r.status === 429 && essai < 2) { await new Promise((ok) => setTimeout(ok, 5000)); return check(u, 2); }
    // 406 : refus du client robot (uber.com, 2026-10-04 : 406 au script, 200 dans un navigateur).
    // 405 : refus de la méthode, pas page absente (ltgov.alaska.gov répond 405 à tout script, accueil
    // compris, curl en navigateur aussi ; us-vital-records, 2026-10-24) : à revérifier à la main.
    if (r.status === 403 || r.status === 405 || r.status === 406 || r.status === 429) blocked.push(`${r.status} ${u}`);
    else if (r.status >= 500) { if (essai < 2) return check(u, 2); down.push(`${r.status} ${u}`); }
    else if (r.status >= 400) {
      // Pas de seconde demande sous une autre identité : 4xx au robot = à vérifier à la main (finition lot L).
      blocked.push(`${r.status} ${u}`);
    }
    else if (NOT_FOUND.test(body.replace(/<[^>]+>/g, ' '))) dead.push(`200 mais « introuvable » ${u}`);
  } catch (e) {
    if (essai < 2) return check(u, 2); down.push(`${e.name === 'TimeoutError' ? 'délai' : 'connexion'} ${u}`);
  }
};
// Une requête à la fois par serveur, six serveurs en parallèle : le Missouri Botanical Garden
// coupait encore 32 connexions sur 420 à six requêtes simultanées (plantcare101.com, 2026-10-04),
// alors que les 70 URL signalées répondaient toutes 200 interrogées une par une.
const parHote = new Map();
for (const u of urls) { let h = ''; try { h = new URL(u).host; } catch {} if (!parHote.has(h)) parHote.set(h, []); parHote.get(h).push(u); }
const hotes = [...parHote.values()];
await Promise.all(Array.from({ length: 6 }, async () => { while (hotes.length) { for (const u of hotes.shift()) await check(u); } }));
console.log(`check-sources: ${urls.size} source(s), ${dead.length} morte(s), ${down.length} injoignable(s), ${blocked.length} bloquée(s) aux robots`);
dead.forEach((d) => console.log('  ✗ ' + d));
down.forEach((d) => console.log('  ~ ' + d + '  (serveur en panne ? à revérifier)'));
blocked.forEach((d) => console.log('  ? ' + d + '  (à vérifier à la main)'));
process.exit(dead.length ? 1 : 0);
