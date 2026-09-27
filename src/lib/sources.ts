/** Sources officielles, tirées du fichier de paramètres (RECETTE §7, §8.3), dans la langue de la page. */
import P from '../data/params-2026.json';
type Key = keyof typeof P.sources;
const s = P.sources as Record<string, { url: string; label: { fr: string; nl: string } }>;
const nlUrl = (u: string) => u.replace('/dmfa/fr/', '/dmfa/nl/').replace('finances.belgium.be/fr/entreprises/personnel_et_remuneration/precompte_professionnel/calcul', 'financien.belgium.be/nl/ondernemingen/personeel_en_loon/bedrijfsvoorheffing/berekening').replace('fin.belgium.be/fr/particuliers/declaration-impot/revenus/taux-imposition', 'fin.belgium.be/nl/particulieren/belastingaangifte/inkomsten/belastingtarieven').replace('www.inasti.be/fr/faq/combien-de-cotisations-sociales-dois-je-payer', 'www.rsvz.be/nl/faq/hoeveel-sociale-bijdragen-moet-ik-betalen');
export const src = (lang: 'fr' | 'nl') => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, { name: v.label[lang], url: lang === 'nl' ? nlUrl(v.url) : v.url }])) as Record<Key, { name: string; url: string }>;
