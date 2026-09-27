/** Configuration centrale du site (générée par new-site.py). */
export const SITE_URL = "https://brutnetto.be";
export const SITE_NAMES: Record<string, string> = {"fr": "BrutNetto.be", "nl": "BrutNetto.be"};
export const LANG_TAGS: Record<string, string> = {"fr": "fr-BE", "nl": "nl-BE"};
export const OG_LOCALES: Record<string, string> = {"fr": "fr_BE", "nl": "nl_BE"};
export const LOCALE_TAG = 'fr-BE';
export const CURRENCY = 'EUR';
export const YEAR = 2026;
/** Année de création du site — signal d'ancienneté (RECETTE §8.0). */
export const SITE_FOUNDED = '2026';
export const LAST_UPDATED = '2026-09-27';
export const AUTHOR_NAME = 'Radif Partners';
export const AUTHOR_ROLE: Record<string, string> = {"fr": "Éditeur de calculateurs de salaire et de guides pratiques · précompte professionnel, ONSS et bonus à l'emploi", "nl": "Uitgever van loonberekeningen en praktische gidsen · bedrijfsvoorheffing, RSZ en werkbonus"};
export const AUTHOR_DESC: Record<string, string> = {"fr": "Radif Partners publie des calculateurs de salaire gratuits et des guides pratiques. Chaque taux de ce site provient du SPF Finances, de l'ONSS, du CNT ou de l'INASTI, avec la source et la date de vérification sur la page.", "nl": "Radif Partners publiceert gratis loonberekeningen en praktische gidsen. Elk tarief op deze site komt van de FOD Financiën, de RSZ, de NAR of het RSVZ, met de bron en de controledatum op de pagina."};
/** Sujets sur lesquels l'editeur est competent (schema.org knowsAbout). Ce sont les
 *  themes reellement traites par le site, pas une liste de mots-cles : un sujet
 *  declare ici sans page qui le couvre est une declaration fausse. */
export const KNOWS_ABOUT: Record<string, string[]> = {"fr": ["Précompte professionnel", "Cotisations ONSS", "Bonus à l'emploi", "Pécule de vacances", "Coût employeur en Belgique"], "nl": ["Bedrijfsvoorheffing", "RSZ-bijdragen", "Werkbonus", "Vakantiegeld", "Werkgeverskost in België"]};
export const CONTACT_EMAIL = "contact@brutnetto.be";
export const THEME_COLOR = '#B3121F';
export const LOGO_SYMBOL = '€';
export const BING_VERIFY_CODE = '';
export const GOOGLE_VERIFY_CODE = '';
/** Régime de consentement : 'opt-in' = rien avant l'accord (UE, Suisse) ;
 *  'notice' = mesure d'audience active avec information préalable et retrait (CA, AU). */
export const CONSENT_MODE: 'opt-in' | 'notice' = 'opt-in';
export const GA4_ID = '';
export const INDEXNOW_KEY = '5e8a1c3f7b2d4a69c0e4f1b8d3a7c2e5';

/* ------------------------------------------------------------------------- *
 * IDENTITÉ LÉGALE — À COMPLÉTER AVANT LA MISE EN LIGNE
 * Ces champs alimentent la mention légale du pays, la politique de confidentialité,
 * la page contact et le schema Organization. Un champ vide s'affiche en jaune
 * sur le site. Contrôle : `npm run check:legal`.
 * ------------------------------------------------------------------------- */
export interface LegalHosting { name: string; address: string; phone: string; url: string }
export interface LegalIdentity {
  entityName: string; legalForm: string; street: string; postalCode: string; city: string;
  country: string; phone: string; registerLabel: string; registerNumber: string;
  vatLabel: string; vatNumber: string; jurisdiction: string;
  supervisoryAuthority: string; supervisoryAuthorityUrl: string; hosting: LegalHosting;
}
export const LEGAL: LegalIdentity = {
  entityName: 'Radif Partners',  // éditeur de tous les sites du portefeuille (RECETTE §8)
  legalForm: '',  // vide : publication à titre personnel, pas de société
  street: '49 rue du Ressort',
  postalCode: '63000',
  city: 'Clermont-Ferrand',
  country: "France",
  phone: '',                 // ligne de contact publiée
  registerLabel: "SIREN",
  registerNumber: '',
  vatLabel: "VAT",
  vatNumber: '',             // laisser vide si non assujetti
  jurisdiction: "France",
  supervisoryAuthority: "Commission nationale de l'informatique et des libertés (CNIL)",
  supervisoryAuthorityUrl: "https://www.cnil.fr",
  hosting: { name: 'GitHub, Inc. (GitHub Pages)', address: '88 Colin P Kelly Jr Street, San Francisco, CA 94107, United States', phone: '', url: 'https://pages.github.com' },
};

/** Champs sans lesquels le site ne doit pas être mis en ligne. */
export const LEGAL_REQUIRED: Array<keyof LegalIdentity> = ['entityName', 'street', 'postalCode', 'city'];

/** Profils publics de l'auteur (schema.org sameAs). Laisser vide si aucun. */
export const AUTHOR_SAME_AS: string[] = [];

/** Rythme de revue éditoriale annoncé sur le site, en mois. */
export const REVIEW_CYCLE_MONTHS = 12;
