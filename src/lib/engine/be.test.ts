import { describe, it, expect } from 'vitest';
import { bareme, ppBase, compute, workBonus, csss, doublePecule, yearEndBonus, employerCost, grossForNet, selfEmployed, exceptionalRate } from './be';

describe('formule-clé 2026', () => {
  it('annexe 1 : montants cumulés officiels', () => { expect(bareme(16710)).toBe(4469.93); expect(bareme(29500)).toBe(9944.05); expect(bareme(51050)).toBe(20320.38); });
  it('simulateur SPF Finances : 2 500 € après retenues sociales, isolé, 1 enfant = 329,01 €', () => { expect(ppBase(2500, { children: 1 }).monthly).toBe(329.01); });
  it('conjoint sans revenus : quotient conjugal plafonné à 13 790 €', () => { const r = ppBase(5000, { situation: 'conjoint_sans' }); expect(r.net).toBe(53930); expect(r.base).toBe(Math.round((bareme(13790) + bareme(53930 - 13790) - 5975.96) * 100) / 100); });
  it('enfants au-delà de 8', () => { expect(ppBase(8000, { children: 9 }).reductions).toBe(Math.min(25860, ppBase(8000, { children: 9 }).base)); });
});
describe('salaire mensuel', () => {
  it('3 500 € employé isolé : calcul à la main', () => {
    const r = compute({ gross: 3500 });
    expect(r.onss).toBe(457.45); expect(r.bonus).toBe(0); expect(r.imposable).toBe(3042.55);
    expect(r.pp).toBe(617.41); expect(r.csss).toBe(33.01); expect(r.net).toBe(2392.13);
  });
  it('salaire minimum 2 189,81 € : bonus écrêté sur le volet B', () => {
    const r = compute({ gross: 2189.81 });
    expect(r.onss).toBe(286.21); expect(r.bonusA).toBe(127.54); expect(r.bonusB).toBe(158.67); expect(r.onssNet).toBe(0);
    expect(r.fiscalBonus).toBe(125.64); expect(r.pp).toBe(122.61); expect(r.csss).toBe(18.58); expect(r.net).toBe(2048.62);
  });
  it('bonus : bornes', () => { expect(workBonus(3403.62).a).toBe(0); expect(workBonus(2937.93)).toEqual({ a: 127.54, b: 0 }); expect(workBonus(2300.62, 'ouvrier').b).toBe(185.75); });
  it('ouvrier : ONSS sur 108 %', () => { expect(compute({ gross: 3500, status: 'ouvrier' }).onss).toBe(494.05); });
  it('CSSS : plafonds', () => { expect(csss(8000, false)).toBe(51.64); expect(csss(8000, true)).toBe(60.94); expect(csss(1500, true)).toBe(9.3); expect(csss(1500, false)).toBe(0); });
  it('net vers brut', () => { expect(Math.abs(grossForNet(2392.13) - 3500)).toBeLessThan(0.02); });
});
describe('primes, pécule, coût, indépendant', () => {
  it('taux exceptionnels', () => { expect(exceptionalRate(36510.6, 'pecule')).toBe(0.4239); expect(exceptionalRate(70000, 'autre')).toBe(0.535); });
  it('double pécule 3 500 €', () => { const d = doublePecule({ gross: 3500 }); expect(d.amount).toBe(3220); expect(d.onss).toBe(388.83); expect(d.pp).toBe(Math.round((3220 - 388.83) * 0.4239 * 100) / 100); });
  it('treizième mois 3 500 €', () => { const y = yearEndBonus({ gross: 3500 }); expect(y.onss).toBe(457.45); expect(y.rate).toBe(0.4644); });
  it('coût employeur 3 500 €', () => { const e = employerCost(3500); expect(e.contributions).toBe(875); expect(e.monthly).toBe(4375); expect(e.annual).toBe(4375 * 13 + 3220); });
  it('indépendant : cotisations au point fixe', () => { const s = selfEmployed(60000); expect(Math.abs(s.contributions - Math.min(60000 - s.contributions, 75024.54) * 0.205)).toBeLessThan(0.05); });
});
