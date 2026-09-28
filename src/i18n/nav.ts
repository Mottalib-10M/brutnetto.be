import { route, MONTHLY, type Locale } from './routes';
import { formatMoney } from '../lib/format';
export interface NavLink { href: string; label: string } export interface NavCategory { label: string; links: NavLink[] }
const L: Record<Locale, Record<string, string>> = {
  fr: {
    home: 'Salaire brut en net', brutNet: 'Calcul brut net détaillé', pp: 'Précompte professionnel', cout: 'Coût employeur', pecule: 'Pécule de vacances', horaire: 'Salaire horaire',
    netBrut: 'Du net au brut', prime: 'Prime de fin d’année', independant: 'Impôts de l’indépendant', baremes: 'Barèmes de l’impôt', minimum: 'Salaire minimum', moyen: 'Salaire moyen', bonus: 'Bonus à l’emploi',
    csss: 'Cotisation spéciale de sécurité sociale', onss: 'Cotisations ONSS', glossary: 'Glossaire', method: 'Méthodologie et sources', widget: 'Intégrer le calculateur',
    about: 'À propos', contact: 'Contact', editorial: 'Politique éditoriale', privacy: 'Confidentialité', terms: 'Mentions légales', cookies: 'Cookies',
  },
  nl: {
    home: 'Bruto netto berekenen', brutNet: 'Bruto netto in detail', pp: 'Bedrijfsvoorheffing', cout: 'Werkgeverskost', pecule: 'Vakantiegeld', horaire: 'Uurloon bruto netto',
    netBrut: 'Van netto naar bruto', prime: 'Eindejaarspremie', independant: 'Belastingen zelfstandige', baremes: 'Belastingschijven', minimum: 'Minimumloon', moyen: 'Gemiddeld loon', bonus: 'Werkbonus',
    csss: 'Bijzondere bijdrage sociale zekerheid', onss: 'RSZ-bijdragen', glossary: 'Woordenlijst', method: 'Methodologie en bronnen', widget: 'Rekenmodule insluiten',
    about: 'Over ons', contact: 'Contact', editorial: 'Redactiebeleid', privacy: 'Privacy', terms: 'Disclaimer', cookies: 'Cookies',
  },
};
export const label = (id: string, l: Locale = 'fr') => L[l][id] ?? id;
const link = (id: string, lang: Locale): NavLink => ({ href: route(id, lang), label: label(id, lang) });
export const monthlyLabel = (a: number, lang: Locale = 'fr') => lang === 'fr' ? `${formatMoney(a, 0, 'fr')} brut` : `${formatMoney(a, 0, 'nl')} bruto`;
const T = { fr: ['Calculateurs', 'Guides', 'Par salaire', 'Le site'], nl: ['Rekenmodules', 'Gidsen', 'Per loon', 'De site'] };
export function navCategories(lang: Locale): NavCategory[] {
  return [
    { label: T[lang][0], links: ['home', 'brutNet', 'pp', 'netBrut', 'horaire', 'pecule', 'prime', 'cout'].map((i) => link(i, lang)) },
    { label: T[lang][1], links: ['baremes', 'onss', 'bonus', 'csss', 'minimum', 'moyen', 'independant'].map((i) => link(i, lang)) },
    { label: T[lang][2], links: MONTHLY.map((a) => ({ href: route(`m-${a}`, lang), label: monthlyLabel(a, lang) })) },
  ];
}
export const navDirect = (lang: Locale): NavLink[] => [link('method', lang)];
export const footerColumns = (lang: Locale): NavCategory[] => [...navCategories(lang).slice(0, 2), { label: T[lang][3], links: ['about', 'contact', 'editorial', 'method', 'glossary', 'widget', 'privacy', 'terms', 'cookies'].map((i) => link(i, lang)) }];
export const popularLinks = (lang: Locale): NavLink[] => MONTHLY.map((a) => ({ href: route(`m-${a}`, lang), label: monthlyLabel(a, lang) }));
