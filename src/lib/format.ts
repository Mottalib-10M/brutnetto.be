/** Formatage monétaire/numérique localisé. Site bilingue : chaque fonction reçoit la langue de la page
 *  (fr → fr-BE « 2 500 € », nl → nl-BE « € 2.500 »), jamais une locale globale implicite. */
import { LOCALE_TAG, CURRENCY, LANG_TAGS } from '../data/site-config';

const cache = new Map<string, Intl.NumberFormat>();
const tagOf = (lang?: string) => (lang ? LANG_TAGS[lang] ?? LOCALE_TAG : LOCALE_TAG);
function nf(opts: Intl.NumberFormatOptions, lang?: string): Intl.NumberFormat {
  const tag = tagOf(lang); const k = tag + JSON.stringify(opts);
  if (!cache.has(k)) cache.set(k, new Intl.NumberFormat(tag, opts));
  return cache.get(k)!;
}
export function formatMoney(value: number, decimals = 0, lang?: string): string {
  return nf({ style: 'currency', currency: CURRENCY, minimumFractionDigits: decimals, maximumFractionDigits: decimals }, lang).format(value);
}
export function formatNumber(value: number, decimals = 0, lang?: string): string {
  return nf({ minimumFractionDigits: decimals, maximumFractionDigits: decimals }, lang).format(value);
}
/** Nombre tiré des paramètres et inséré dans un texte : décimales utiles seulement (RECETTE §4, §17.4). */
export function formatDecimal(value: number, max = 2, lang?: string): string {
  return nf({ maximumFractionDigits: max }, lang).format(value);
}
export function formatPercent(value: number, decimals = 1, lang?: string): string {
  // Toutes langues : espace insécable avant % (RECETTE §7).
  return nf({ style: 'percent', minimumFractionDigits: decimals, maximumFractionDigits: decimals }, lang).format(value).replace(/(\d)\s?%/, '$1\u00a0%');
}
/** Raccourci pour une page : const f = fmt(lang); f.money(2500) … */
export const fmt = (lang: string) => ({
  money: (v: number, d = 0) => formatMoney(v, d, lang), num: (v: number, d = 0) => formatNumber(v, d, lang),
  pct: (v: number, d = 1) => formatPercent(v, d, lang), dec: (v: number, m = 2) => formatDecimal(v, m, lang),
});
export function parseLocaleNumber(input: string): number {
  const cleaned = input.replace(/[^\d.,-]/g, '');
  // Détecte le séparateur décimal : le dernier des deux symboles
  const lastComma = cleaned.lastIndexOf(','), lastDot = cleaned.lastIndexOf('.');
  let s = cleaned;
  if (lastComma > lastDot) s = cleaned.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(cleaned)) s = cleaned.replace(/\./g, ''); // séparateur de milliers nl-BE
  else s = cleaned.replace(/,/g, '');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

/** Date de mise à jour écrite dans la langue de la page (registre 2026-09-21) : « 27 September 2026 »,
 *  jamais le format machine. Fuseau UTC forcé, sinon la date recule d'un jour à l'ouest de Greenwich.
 *  Le format ISO reste dans l'attribut `datetime` de la balise <time>. */
export function displayDate(iso: string, langTag: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(langTag, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
