/**
 * Moteur belge 2026 : fonctions pures, paramètres lus dans params-2026.json.
 * Précompte professionnel : formule-clé SPF Finances (rémunérations payées à partir du 1er janvier 2026),
 * arrondi au cent à chaque étape (formule-clé, point 3). Bonus à l'emploi : barèmes ONSS dès le 1er septembre 2026.
 */
import P from '../../data/params-2026.json';

export type Status = 'employe' | 'ouvrier';
export type Situation = 'isole' | 'conjoint_revenus' | 'conjoint_sans';
const r2 = (x: number) => Math.round(Number((x * 100).toFixed(6))) / 100; // demi-cent arrondi vers le haut, sans erreur de virgule flottante

/** Barème de base (annexe 1). */
export function bareme(income: number): number {
  // Comme l'annexe 1 : montant cumulé arrondi au cent au début de chaque tranche, plus le taux sur l'excédent.
  let cum = 0, prev = 0;
  for (const t of P.pp.bareme) {
    const top = t.upto ?? Infinity;
    if (income <= top) return r2(cum + r2((Math.max(0, income) - prev) * t.rate));
    cum = r2(cum + r2((top - prev) * t.rate)); prev = top;
  }
  return r2(cum);
}

/** Bonus à l'emploi social (volets A et B), montant de base R pour un temps plein. */
export function workBonus(gross: number, status: Status = 'employe') {
  const W = P.bonus[status];
  const a = gross <= W.a_from ? W.a_max : gross <= W.a_to ? Math.max(0, r2(W.a_max - W.a_slope * (gross - W.a_from))) : 0;
  const b = gross <= W.b_from ? W.b_max : gross <= W.b_to ? Math.max(0, r2(W.b_max - W.b_slope * (gross - W.b_from))) : 0;
  return { a, b };
}

export interface Input {
  gross: number;            // brut mensuel (à 100 %)
  status?: Status;
  situation?: Situation;
  children?: number;
  parentIsole?: boolean;    // parent isolé avec enfants à charge (annexe 4, point 1)
  groupInsurance?: number;  // retenue personnelle mensuelle d'assurance de groupe
}

/** Précompte professionnel mensuel sur un imposable mensuel donné (étapes A à D de la formule-clé). */
export function ppBase(imposable: number, o: { situation?: Situation; children?: number; parentIsole?: boolean } = {}) {
  const annual = r2(imposable * 12);
  const frais = Math.min(r2(annual * P.pp.frais_rate), P.pp.frais_max);
  const net = r2(annual - frais);
  let base: number;
  if (o.situation === 'conjoint_sans') {
    const imputed = Math.min(r2(net * P.pp.conjoint_rate), P.pp.conjoint_max);
    base = r2(bareme(imputed) + bareme(r2(net - imputed)) - 2 * P.pp.quotite_reduction);
  } else base = r2(bareme(net) - P.pp.quotite_reduction);
  base = Math.max(0, base);
  const n = Math.max(0, Math.floor(o.children ?? 0));
  const E = P.pp.enfants;
  let red = n < E.length ? E[n] : E[E.length - 1] + (n - (E.length - 1)) * P.pp.enfant_sup;
  if (o.parentIsole && n > 0 && o.situation !== 'conjoint_sans') red += P.pp.parent_isole;
  const annualTax = r2(Math.max(0, base - red));
  return { annual, frais, net, base, reductions: Math.min(red, base), annualTax, monthly: r2(annualTax / 12) };
}

/** Cotisation spéciale de sécurité sociale, retenue mensuelle. */
export function csss(gross: number, twoIncomes: boolean): number {
  const C = P.csss; const S = gross;
  if (S <= C.t0) return 0;
  if (S <= C.t1) return twoIncomes ? C.two_income_flat : 0;
  if (S <= C.t2) { const v = r2(C.rate1 * (S - C.t1)); return twoIncomes ? Math.max(v, C.two_income_flat) : v; }
  const cap = twoIncomes ? C.max_two : C.max_single;
  if (S <= C.t3) return Math.min(r2(C.base2 + C.rate2 * (S - C.t2)), cap);
  return cap;
}

export function compute(i: Input) {
  const gross = Math.max(0, i.gross); const status = i.status ?? 'employe'; const situation = i.situation ?? 'isole';
  const onss = r2(gross * (status === 'ouvrier' ? P.onss.ouvrier_base : 1) * P.onss.worker);
  let { a, b } = workBonus(gross, status);
  // Écrêtement si les cotisations personnelles ne suffisent pas : d'abord le volet B, ensuite le volet A.
  if (a + b > onss) { b = Math.max(0, r2(onss - a)); if (a > onss) a = onss; }
  const bonus = r2(a + b);
  const onssNet = r2(onss - bonus);
  const imposable = r2(gross - onssNet);
  const base = ppBase(imposable, { situation, children: i.children, parentIsole: i.parentIsole });
  const groupe = r2(Math.max(0, i.groupInsurance ?? 0) * P.pp.groupe_rate);
  const fiscalBonus = r2(r2(a * P.bonus.fiscal_a) + r2(b * P.bonus.fiscal_b));
  const pp = Math.max(0, r2(base.monthly - groupe - fiscalBonus));
  const cs = csss(gross, situation === 'conjoint_revenus');
  const net = r2(gross - onssNet - pp - cs - Math.max(0, i.groupInsurance ?? 0));
  return { gross, status, situation, onss, bonusA: a, bonusB: b, bonus, onssNet, imposable, ppBase: base, fiscalBonus, pp, csss: cs, net, rate: gross > 0 ? 1 - net / gross : 0 };
}

/** Brut mensuel nécessaire pour un net mensuel donné. */
export function grossForNet(net: number, o: Omit<Input, 'gross'> = {}): number {
  if (net <= 0) return 0;
  let lo = net, hi = net * 3 + 1000;
  for (let k = 0; k < 80; k++) { const mid = (lo + hi) / 2; if (compute({ ...o, gross: mid }).net < net) lo = mid; else hi = mid; }
  return r2(hi);
}

/** Taux de précompte des allocations exceptionnelles (pécules, primes) selon la rémunération annuelle normale. */
export function exceptionalRate(annualNormal: number, kind: 'pecule' | 'autre'): number {
  for (const t of P.exceptionnel) if (annualNormal <= (t.upto ?? Infinity)) return t[kind];
  return 0.535;
}

/** Double pécule de vacances d'un employé : 92 % du brut mensuel, cotisation de 13,07 % sur 85/92. */
export function doublePecule(i: Input) {
  const m = compute(i);
  const amount = r2(i.gross * P.pecule.double_rate);
  const onss = r2(i.gross * P.pecule.double_onss_share * P.onss.worker);
  const rate = exceptionalRate(r2(m.imposable * 12), 'pecule');
  const pp = r2((amount - onss) * rate);
  return { amount, onss, rate, pp, net: r2(amount - onss - pp) };
}

/** Prime de fin d'année (treizième mois) égale à un mois de brut. */
export function yearEndBonus(i: Input, amount = i.gross) {
  const m = compute(i);
  const onss = r2(amount * (i.status === 'ouvrier' ? P.onss.ouvrier_base : 1) * P.onss.worker);
  const rate = exceptionalRate(r2(m.imposable * 12), 'autre');
  const pp = r2((amount - onss) * rate);
  return { amount, onss, rate, pp, net: r2(amount - onss - pp) };
}

/** Coût employeur d'un employé : cotisations patronales de base et modération salariale (catégorie 1). */
export function employerCost(gross: number, o: { thirteenth?: boolean } = {}) {
  const rate = P.onss.employer_base + P.onss.employer_moderation;
  const monthly = r2(gross * (1 + rate));
  const thirteenth = o.thirteenth === false ? 0 : monthly;
  const pecule = r2(gross * P.pecule.double_rate);
  return { rate, contributions: r2(gross * rate), monthly, annual: r2(monthly * 12 + thirteenth + pecule), pecule, thirteenth };
}

/** Impôt des personnes physiques annuel (barème, quotité exemptée, additionnels communaux). */
export function ipp(taxable: number, communal: number = P.ipp.communal_default): number {
  let tax = 0, prev = 0;
  for (const b of P.ipp.brackets) { const top = b.upto ?? Infinity; if (taxable > prev) tax += (Math.min(taxable, top) - prev) * b.rate; prev = top; if (taxable <= top) break; }
  const exempt = Math.min(P.ipp.quotite, taxable) * P.ipp.brackets[0].rate;
  const state = Math.max(0, tax - exempt);
  return r2(state * (1 + communal));
}

/** Indépendant à titre principal : cotisations sociales INASTI puis IPP sur le revenu net. */
export function selfEmployed(profit: number, communal: number = P.ipp.communal_default) {
  const I = P.inasti;
  const contrib = (inc: number) => { const base = Math.max(inc, I.min_income); return r2(Math.min(base, I.limit1) * I.rate1 + Math.max(0, Math.min(base, I.limit2) - I.limit1) * I.rate2); };
  // Les cotisations se calculent sur le revenu net de cotisations : point fixe.
  let c = contrib(profit);
  for (let k = 0; k < 40; k++) c = contrib(Math.max(0, profit - c));
  const taxable = Math.max(0, r2(profit - c));
  const tax = ipp(taxable, communal);
  return { profit, contributions: c, quarterly: r2(c / 4), taxable, tax, net: r2(profit - c - tax) };
}

export const hourlyToMonthly = (h: number, hoursWeek: number = P.rmmmg.hours_week) => r2((h * hoursWeek * 52) / 12);
