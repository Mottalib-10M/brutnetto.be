import type { Locale } from './routes';
const fr = {
  updatedOn: 'Mis à jour le', editorialPolicy: 'Politique éditoriale', contactLabel: 'Contact', reviewedBy: 'Vérifié par',
  skipToContent: 'Aller au contenu', mainNav: 'Navigation principale', breadcrumbLabel: 'Fil d’Ariane', breadcrumbHome: 'Accueil', menuOpen: 'Ouvrir le menu',
  faqTitle: 'Questions fréquentes', relatedCalculators: 'Calculateurs et guides liés', sourcesTitle: 'Sources', writtenBy: 'Rédigé par',
  asOf: 'Taux', lastUpdated: 'vérifiés le', footerValidated: 'Formule-clé SPF Finances 2026 · ONSS 13,07 % · bonus à l’emploi au 1er septembre 2026',
  footerBrowser: 'Calculé dans votre navigateur · rien de ce que vous saisissez n’est envoyé · gratuit',
  footerDisclaimer: 'Estimation : ce site ne constitue pas un conseil fiscal ou juridique et ne remplace pas votre fiche de paie, votre avertissement-extrait de rôle ni un secrétariat social.',
  footerPopular: 'Exemples par salaire', notFound: 'Cette page n’existe pas.',
};
const nl: typeof fr = {
  updatedOn: 'Bijgewerkt op', editorialPolicy: 'Redactiebeleid', contactLabel: 'Contact', reviewedBy: 'Nagekeken door',
  skipToContent: 'Naar de inhoud', mainNav: 'Hoofdmenu', breadcrumbLabel: 'Kruimelpad', breadcrumbHome: 'Home', menuOpen: 'Menu openen',
  faqTitle: 'Veelgestelde vragen', relatedCalculators: 'Verwante rekenmodules en gidsen', sourcesTitle: 'Bronnen', writtenBy: 'Geschreven door',
  asOf: 'Tarieven', lastUpdated: 'nagekeken op', footerValidated: 'Sleutelformule FOD Financiën 2026 · RSZ 13,07 % · werkbonus vanaf 1 september 2026',
  footerBrowser: 'Berekend in je browser · niets van wat je invult wordt verstuurd · gratis',
  footerDisclaimer: 'Schatting: deze site is geen fiscaal of juridisch advies en vervangt je loonfiche, je aanslagbiljet of een sociaal secretariaat niet.',
  footerPopular: 'Voorbeelden per loon', notFound: 'Deze pagina bestaat niet.',
};
export function t(lang: Locale) { return lang === 'nl' ? nl : fr; }
