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
    // CSSS : 10,33 + 1,10 % × (3 500 − 2 190,18) = 24,74 ; net : 3 500 − 457,45 − 617,41 − 24,74.
    expect(r.pp).toBe(617.41); expect(r.csss).toBe(24.74); expect(r.net).toBe(2400.4);
  });
  it('salaire minimum 2 189,81 € : bonus écrêté sur le volet B', () => {
    const r = compute({ gross: 2189.81 });
    expect(r.onss).toBe(286.21); expect(r.bonusA).toBe(127.54); expect(r.bonusB).toBe(158.67); expect(r.onssNet).toBe(0);
    // CSSS : 4,22 % × (2 189,81 − 1 945,38) = 10,31 ; net : 2 189,81 − 122,61 − 10,31.
    expect(r.fiscalBonus).toBe(125.64); expect(r.pp).toBe(122.61); expect(r.csss).toBe(10.31); expect(r.net).toBe(2056.89);
  });
  it('bonus : bornes', () => { expect(workBonus(3403.62).a).toBe(0); expect(workBonus(2937.93)).toEqual({ a: 127.54, b: 0 }); expect(workBonus(2300.62, 'ouvrier').b).toBe(185.75); });
  it('ouvrier : ONSS sur 108 %', () => { expect(compute({ gross: 3500, status: 'ouvrier' }).onss).toBe(494.05); });
  // Montants calculés à la main depuis ONSS 2026/3 (montants trimestriels divisés par trois).
  it('CSSS isolé, imposition individuelle : chaque tranche', () => {
    expect(csss(1945.38)).toBe(0);
    expect(csss(2000)).toBe(2.3);     // 4,22 % × 54,62
    expect(csss(3500)).toBe(24.74);   // 10,33 + 1,10 % × 1 309,82
    expect(csss(4000)).toBe(36.24);   // 27,35 + 3,38 % × 263
    expect(csss(5000)).toBe(49.51);   // 39,61 + 1,10 % × 900
    expect(csss(6038.82)).toBe(60.94); // 39,61 + 1,10 % × 1 938,82
    expect(csss(8000)).toBe(60.94);
  });
  it('CSSS conjoint avec revenus : forfait, minimum et plafond', () => {
    const s = 'conjoint_revenus' as const;
    expect(csss(1095.09, s)).toBe(0);
    expect(csss(1095.1, s)).toBe(5.15);
    expect(csss(1945.38, s)).toBe(5.15);
    expect(csss(2000, s)).toBe(5.15);   // 5,90 % × 54,62 = 3,22, relevé au minimum
    expect(csss(2100, s)).toBe(9.12);   // 5,90 % × 154,62
    expect(csss(3500, s)).toBe(28.85);  // 14,44 + 1,10 % × 1 309,82
    expect(csss(5571, s)).toBe(51.63);  // 14,44 + 1,10 % × 3 380,82
    expect(csss(8000, s)).toBe(51.64);
  });
  it('CSSS conjoint sans revenus : rien sous le seuil, plafond plus haut', () => {
    const s = 'conjoint_sans' as const;
    expect(csss(1500, s)).toBe(0);
    expect(csss(2000, s)).toBe(3.22);   // 5,90 % × 54,62
    expect(csss(3500, s)).toBe(28.85);
    expect(csss(6200, s)).toBe(58.55);  // 14,44 + 1,10 % × 4 009,82
    expect(csss(8000, s)).toBe(60.94);
  });
  it('CSSS ouvrier : barème appliqué à 108 % du brut', () => {
    expect(csss(3500, 'isole', 'ouvrier')).toBe(28.8); // 3 780 : 27,35 + 3,38 % × 43
    expect(compute({ gross: 3500, status: 'ouvrier' }).csss).toBe(28.8);
  });
  it('CSSS dans le net : la situation choisie est bien appliquée', () => {
    expect(compute({ gross: 8000 }).csss).toBe(60.94);
    expect(compute({ gross: 8000, situation: 'conjoint_revenus' }).csss).toBe(51.64);
    expect(compute({ gross: 8000, situation: 'conjoint_sans' }).csss).toBe(60.94);
  });
  it('net vers brut', () => { expect(Math.abs(grossForNet(2400.4) - 3500)).toBeLessThan(0.02); });
});
describe('primes, pécule, coût, indépendant', () => {
  it('taux exceptionnels', () => { expect(exceptionalRate(36510.6, 'pecule')).toBe(0.4239); expect(exceptionalRate(70000, 'autre')).toBe(0.535); });
  it('double pécule 3 500 €', () => { const d = doublePecule({ gross: 3500 }); expect(d.amount).toBe(3220); expect(d.onss).toBe(388.83); expect(d.pp).toBe(Math.round((3220 - 388.83) * 0.4239 * 100) / 100); });
  it('treizième mois 3 500 €', () => { const y = yearEndBonus({ gross: 3500 }); expect(y.onss).toBe(457.45); expect(y.rate).toBe(0.4644); });
  it('coût employeur 3 500 €', () => { const e = employerCost(3500); expect(e.contributions).toBe(875); expect(e.monthly).toBe(4375); expect(e.annual).toBe(4375 * 13 + 3220); });
  it('indépendant : cotisations au point fixe', () => { const s = selfEmployed(60000); expect(Math.abs(s.contributions - Math.min(60000 - s.contributions, 75024.54) * 0.205)).toBeLessThan(0.05); });
});
