/** Situe un brut mensuel par rapport aux repères Eurostat (enquête sur la structure des salaires, temps plein). */
import P from '../data/params-2026.json';
import { fmt } from './format';
const E = P.salaires.ses;
export function position(gross: number, lang: 'fr' | 'nl'): string {
  const f = fmt(lang);
  const d = (ref: number) => { const x = gross / ref - 1; return Math.abs(x) < 0.005 ? null : { v: f.pct(Math.abs(x), 0), up: x > 0 }; };
  const m = d(E.median); const a = d(E.moyen);
  if (lang === 'fr') {
    const rel = (x: ReturnType<typeof d>, nom: string, ref: number) => x ? `${x.v} ${x.up ? 'au-dessus' : 'en dessous'} du salaire ${nom} de ${f.money(ref, 0)}` : `au niveau du salaire ${nom} de ${f.money(ref, 0)}`;
    const zone = gross < E.d1 ? 'parmi les 10 % de salaires à temps plein les plus bas' : gross < E.median ? 'dans la moitié inférieure des salaires à temps plein, au-dessus des 10 % les plus bas' : gross < E.d9 ? 'dans la moitié supérieure des salaires à temps plein, sous les 10 % les plus élevés' : 'parmi les 10 % de salaires à temps plein les plus élevés';
    return `Selon les derniers chiffres d’Eurostat, pour 2022, un brut de ${f.money(gross, 0)} se situe ${rel(m, 'médian', E.median)} et ${rel(a, 'moyen', E.moyen)}, soit ${zone}. Les salaires ont été indexés depuis : en 2026, la médiane est plus haute et ce salaire se classe un peu plus bas.`;
  }
  const rel = (x: ReturnType<typeof d>, nom: string, ref: number) => x ? `${x.v} ${x.up ? 'meer' : 'minder'} dan het ${nom} van ${f.money(ref, 0)}` : `evenveel als het ${nom} van ${f.money(ref, 0)}`;
  const zone = gross < E.d1 ? 'bij de 10 % laagste voltijdse lonen' : gross < E.median ? 'in de onderste helft van de voltijdse lonen, boven de 10 % laagste' : gross < E.d9 ? 'in de bovenste helft van de voltijdse lonen, onder de 10 % hoogste' : 'bij de 10 % hoogste voltijdse lonen';
  return `Volgens de recentste cijfers van Eurostat, voor 2022, verdient wie ${f.money(gross, 0)} bruto ontvangt ${rel(m, 'mediaanloon', E.median)} en ${rel(a, 'gemiddelde loon', E.moyen)}, en zit dus ${zone}. De lonen zijn sindsdien geïndexeerd: in 2026 ligt de mediaan hoger en scoort dit loon iets lager.`;
}
