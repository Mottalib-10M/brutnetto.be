/** Mini-simulateurs des guides (RECETTE §9.3), en français et en néerlandais, calculés par le moteur belge. */
import { compute, csss, selfEmployed } from './engine/be';
import P from '../data/params-2026.json';
import { fmt } from './format';
import type { MiniSpec } from './mini-types';

type L = 'fr' | 'nl';
const T = <A, B>(l: L, fr: A, nl: B) => (l === 'fr' ? fr : nl);
const brut = (l: L, def = 3500) => ({ id: 'g', label: T(l, 'Salaire brut mensuel', 'Bruto maandloon'), def, unit: '€', max: 100000 });
const E = P.salaires.ses;

const SPECS: Record<string, (l: L) => MiniSpec> = {
  pp: (l) => { const f = fmt(l); return { title: T(l, 'Votre précompte professionnel', 'Uw bedrijfsvoorheffing'), cta: T(l, 'Calcul brut net complet', 'Volledige bruto netto berekening'), inputs: [brut(l)], run: ({ g }) => {
    const r = compute({ gross: g }); return { head: [T(l, 'Précompte professionnel par mois', 'Bedrijfsvoorheffing per maand'), f.money(r.pp, 2)], rows: [[T(l, 'Salaire imposable', 'Belastbaar loon'), f.money(r.imposable, 2)], [T(l, 'Taux sur le brut', 'Aandeel van het brutoloon'), f.pct(g ? r.pp / g : 0, 1)], [T(l, 'Net', 'Netto'), f.money(r.net, 2)]] };
  } }; },
  bonus: (l) => { const f = fmt(l); return { title: T(l, 'Avez-vous droit au bonus à l’emploi ?', 'Hebt u recht op de werkbonus?'), cta: T(l, 'Calcul brut net complet', 'Volledige bruto netto berekening'), inputs: [brut(l, 2600)], run: ({ g }) => {
    const r = compute({ gross: g }); return { head: [T(l, 'Bonus à l’emploi par mois', 'Werkbonus per maand'), f.money(r.bonus + r.fiscalBonus, 2)], rows: [[T(l, 'Volet A (social)', 'Luik A (sociaal)'), f.money(r.bonusA, 2)], [T(l, 'Volet B (social)', 'Luik B (sociaal)'), f.money(r.bonusB, 2)], [T(l, 'Bonus fiscal sur le précompte', 'Fiscale werkbonus op de voorheffing'), f.money(r.fiscalBonus, 2)]] };
  } }; },
  csss: (l) => { const f = fmt(l); return { title: T(l, 'Votre cotisation spéciale de sécurité sociale', 'Uw bijzondere bijdrage voor de sociale zekerheid'), cta: T(l, 'Calcul brut net complet', 'Volledige bruto netto berekening'), inputs: [brut(l, 4000), { id: 'd', label: T(l, 'Ménage', 'Gezin'), def: 0, options: [{ value: '0', label: T(l, 'Isolé ou un seul revenu', 'Alleenstaand of één inkomen') }, { value: '1', label: T(l, 'Deux revenus', 'Twee inkomens') }] }], run: ({ g, d }) => {
    const c = csss(g, d === 1); return { head: [T(l, 'Cotisation spéciale par mois', 'Bijzondere bijdrage per maand'), f.money(c, 2)], rows: [[T(l, 'Par an', 'Per jaar'), f.money(c * 12, 2)], [T(l, 'Part du brut', 'Aandeel van het brutoloon'), f.pct(g ? c / g : 0, 2)]] };
  } }; },
  onss: (l) => { const f = fmt(l); return { title: T(l, 'Vos cotisations ONSS', 'Uw RSZ-bijdragen'), cta: T(l, 'Calcul brut net complet', 'Volledige bruto netto berekening'), inputs: [brut(l), { id: 's', label: T(l, 'Statut', 'Statuut'), def: 0, options: [{ value: '0', label: T(l, 'Employé', 'Bediende') }, { value: '1', label: T(l, 'Ouvrier', 'Arbeider') }] }], run: ({ g, s }) => {
    const r = compute({ gross: g, status: s === 1 ? 'ouvrier' : 'employe' }); return { head: [T(l, 'ONSS retenue par mois', 'Ingehouden RSZ per maand'), f.money(r.onssNet, 2)], rows: [[`${T(l, 'ONSS à', 'RSZ aan')} ${f.pct(P.onss.worker, 2)}`, f.money(r.onss, 2)], [T(l, 'Bonus à l’emploi déduit', 'Afgetrokken werkbonus'), f.money(r.bonus, 2)], [T(l, 'Net', 'Netto'), f.money(r.net, 2)]] };
  } }; },
  indep: (l) => { const f = fmt(l); return { title: T(l, 'Cotisations et impôt de l’indépendant', 'Bijdragen en belasting van de zelfstandige'), cta: T(l, 'Calcul complet de l’indépendant', 'Volledige berekening voor zelfstandigen'), inputs: [{ id: 'p', label: T(l, 'Revenu professionnel net par an', 'Netto beroepsinkomen per jaar'), def: 50000, unit: '€', max: 5000000 }], run: ({ p }) => {
    const s = selfEmployed(p); return { head: [T(l, 'Reste après cotisations et impôt', 'Over na bijdragen en belasting'), f.money(s.net, 0)], rows: [[T(l, 'Cotisations sociales par an', 'Sociale bijdragen per jaar'), f.money(s.contributions, 0)], [T(l, 'Par trimestre', 'Per kwartaal'), f.money(s.quarterly, 0)], [T(l, 'Impôt des personnes physiques', 'Personenbelasting'), f.money(s.tax, 0)]] };
  } }; },
  minimum: (l) => { const f = fmt(l); return { title: T(l, 'Salaire minimum en net, selon le temps de travail', 'Minimumloon netto, volgens de arbeidstijd'), cta: T(l, 'Calcul du salaire horaire', 'Uurloon berekenen'), inputs: [{ id: 'h', label: T(l, 'Temps de travail', 'Arbeidstijd'), def: 100, options: [100, 80, 75, 60, 50].map((x) => ({ value: String(x), label: `${x} %` })) }], run: ({ h }) => {
    const g = P.rmmmg.amount * h / 100; const r = compute({ gross: g }); return { head: [T(l, 'Net par mois', 'Netto per maand'), f.money(r.net, 2)], rows: [[T(l, 'Brut', 'Bruto'), f.money(g, 2)], [T(l, 'ONSS après bonus', 'RSZ na werkbonus'), f.money(r.onssNet, 2)], [T(l, 'Précompte professionnel', 'Bedrijfsvoorheffing'), f.money(r.pp, 2)]] };
  } }; },
  moyen: (l) => { const f = fmt(l); return { title: T(l, 'Comparez votre salaire à la médiane', 'Vergelijk uw loon met de mediaan'), cta: T(l, 'Calcul brut net complet', 'Volledige bruto netto berekening'), inputs: [brut(l, E.median)], run: ({ g }) => {
    const r = compute({ gross: g }); const d = g / E.median - 1; return { head: [T(l, 'Net par mois', 'Netto per maand'), f.money(r.net, 0)], rows: [[T(l, 'Par rapport au salaire médian (Eurostat 2022)', 'Ten opzichte van het mediaanloon (Eurostat 2022)'), `${d >= 0 ? '+' : '−'}${f.pct(Math.abs(d), 0)}`], [T(l, 'Par rapport au salaire moyen', 'Ten opzichte van het gemiddelde loon'), `${g >= E.moyen ? '+' : '−'}${f.pct(Math.abs(g / E.moyen - 1), 0)}`], [T(l, 'Précompte et cotisations', 'Voorheffing en bijdragen'), f.money(g - r.net, 0)]] };
  } }; },
};

export function getSpec(kind: string, lang = 'fr'): MiniSpec {
  const s = SPECS[kind]; if (!s) throw new Error(`Mini-simulateur inconnu : ${kind}`); return s(lang === 'nl' ? 'nl' : 'fr');
}
