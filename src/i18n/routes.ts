import { makeRouter, type RouteDef } from './routes-core';
export const LOCALES = ['fr', 'nl'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'fr';
/** Pages par montant (brut mensuel), chacune adossée à un seuil propre (lib/amount-angles.ts). */
export const MONTHLY = [2200, 2500, 2800, 3000, 3200, 3500, 3800, 4000, 4500, 5000, 6000, 7000] as const;
const r = (id: string, fr: string, nl: string, noindex = false): RouteDef<Locale> => ({ id, paths: { fr, nl }, ...(noindex ? { noindex } : {}) });
export const ROUTES: RouteDef<Locale>[] = [
  r('home', '/fr/', '/nl/'),
  r('brutNet', '/fr/calcul-salaire-brut-net/', '/nl/bruto-netto-berekenen/'),
  r('pp', '/fr/precompte-professionnel/', '/nl/bedrijfsvoorheffing-berekenen/'),
  r('cout', '/fr/cout-employeur/', '/nl/werkgeverskost-berekenen/'),
  r('pecule', '/fr/pecule-de-vacances/', '/nl/vakantiegeld-berekenen/'),
  r('horaire', '/fr/salaire-horaire/', '/nl/uurloon-bruto-netto/'),
  r('netBrut', '/fr/net-brut/', '/nl/netto-bruto/'),
  r('prime', '/fr/prime-de-fin-annee/', '/nl/eindejaarspremie/'),
  r('independant', '/fr/independant-impots/', '/nl/zelfstandige-belastingen/'),
  r('baremes', '/fr/baremes-impot/', '/nl/belastingschijven/'),
  r('minimum', '/fr/salaire-minimum/', '/nl/minimumloon/'),
  r('moyen', '/fr/salaire-moyen/', '/nl/gemiddeld-loon/'),
  r('bonus', '/fr/bonus-emploi/', '/nl/werkbonus/'),
  r('csss', '/fr/cotisation-speciale-securite-sociale/', '/nl/bijzondere-bijdrage-sociale-zekerheid/'),
  r('onss', '/fr/cotisations-onss/', '/nl/rsz-bijdragen/'),
  ...MONTHLY.map((a) => r(`m-${a}`, `/fr/salaire-brut-${a}-euros-net/`, `/nl/brutoloon-${a}-euro-netto/`)),
  r('glossary', '/fr/glossaire/', '/nl/woordenlijst/'),
  r('method', '/fr/methodologie/', '/nl/methodologie/'),
  r('widget', '/fr/widget/', '/nl/widget/', true),
  r('about', '/fr/a-propos/', '/nl/over-ons/'),
  r('contact', '/fr/contact/', '/nl/contact/'),
  r('editorial', '/fr/politique-editoriale/', '/nl/redactiebeleid/'),
  r('privacy', '/fr/confidentialite/', '/nl/privacy/', true),
  r('terms', '/fr/mentions-legales/', '/nl/disclaimer/', true),
  r('cookies', '/fr/cookies/', '/nl/cookies/', true),
];
export const { NOINDEX_PATHS, route, hasRoute, altPaths } = makeRouter(LOCALES, ROUTES);
