import { useEffect, useMemo, useState } from 'react';
import NumberField from '../ui/NumberField';
import SelectField from '../ui/SelectField';
import Toggle from '../ui/Toggle';
import StackedBar from '../ui/StackedBar';
import { compute, grossForNet, doublePecule, yearEndBonus, employerCost, selfEmployed, hourlyToMonthly, type Status, type Situation } from '../../lib/engine/be';
import P from '../../data/params-2026.json';
import { formatMoney, formatPercent } from '../../lib/format';
import { readParams, num, str, updateURL } from '../../lib/url-state';

export type Mode = 'brutNet' | 'pp' | 'cout' | 'pecule' | 'horaire' | 'netBrut' | 'prime' | 'independant';
type Lang = 'fr' | 'nl';
interface Props { mode?: Mode; lang?: Lang; initialGross?: number; initialHourly?: number; methodHref?: string }

const S = {
  fr: {
    gross: 'Salaire brut mensuel', grossHelp: 'Montant brut à 100 %, temps plein', net: 'Salaire net mensuel souhaité', hourly: 'Salaire horaire brut', hours: 'Heures par semaine',
    profit: 'Bénéfice annuel avant cotisations sociales', status: 'Statut', employe: 'Employé', ouvrier: 'Ouvrier', situation: 'Situation familiale',
    isole: 'Isolé', conjR: 'Marié ou cohabitant légal, conjoint avec revenus', conjS: 'Marié ou cohabitant légal, conjoint sans revenus', children: 'Enfants à charge', parent: 'Parent isolé ?',
    no: 'Non', yes: 'Oui', group: 'Retenue assurance de groupe par mois', communal: 'Taxe communale', free: 'Calculé dans votre navigateur · rien n’est envoyé · gratuit',
    netMonth: 'Salaire net par mois', grossNeeded: 'Salaire brut mensuel nécessaire', ppMonth: 'Précompte professionnel par mois', cost: 'Coût employeur par mois',
    pecule: 'Double pécule de vacances net', prime: 'Prime de fin d’année nette', indep: 'Revenu net annuel de l’indépendant',
    rowGross: 'Salaire brut', rowOnss: 'Cotisations ONSS personnelles (13,07 %)', rowBonus: 'Bonus à l’emploi social', rowImposable: 'Rémunération imposable', rowPp: 'Précompte professionnel',
    rowFiscal: 'dont réduction bonus à l’emploi fiscal', rowCsss: 'Cotisation spéciale de sécurité sociale', rowGroup: 'Assurance de groupe', rowNet: 'Salaire net',
    rowEmployer: 'Cotisations patronales (25 %)', rowCostMonth: 'Coût mensuel', rowCostYear: 'Coût annuel (13 mois + double pécule)', rowAmount: 'Montant brut', rowRate: 'Taux de précompte',
    rowContrib: 'Cotisations sociales INASTI', rowQuarter: 'Par trimestre', rowTax: 'Impôt des personnes physiques estimé', rowTaxable: 'Revenu imposable',
    note: 'Formule-clé SPF Finances 2026, ONSS 13,07 %, bonus à l’emploi au 1er septembre 2026. Estimation : votre fiche de paie fait foi.',
    copy: 'Copier le résultat', copied: 'Copié', print: 'Imprimer', how: 'Méthode de calcul', bar: 'Répartition du salaire brut', legend: ['Net', 'ONSS', 'Précompte', 'CSSS'],
  },
  nl: {
    gross: 'Brutomaandloon', grossHelp: 'Brutobedrag aan 100 %, voltijds', net: 'Gewenst nettomaandloon', hourly: 'Bruto-uurloon', hours: 'Uren per week',
    profit: 'Jaarwinst vóór sociale bijdragen', status: 'Statuut', employe: 'Bediende', ouvrier: 'Arbeider', situation: 'Gezinssituatie',
    isole: 'Alleenstaande', conjR: 'Gehuwd of wettelijk samenwonend, partner met inkomen', conjS: 'Gehuwd of wettelijk samenwonend, partner zonder inkomen', children: 'Kinderen ten laste', parent: 'Alleenstaande ouder?',
    no: 'Nee', yes: 'Ja', group: 'Inhouding groepsverzekering per maand', communal: 'Gemeentebelasting', free: 'Berekend in je browser · niets wordt verstuurd · gratis',
    netMonth: 'Nettoloon per maand', grossNeeded: 'Nodig brutomaandloon', ppMonth: 'Bedrijfsvoorheffing per maand', cost: 'Werkgeverskost per maand',
    pecule: 'Dubbel vakantiegeld netto', prime: 'Eindejaarspremie netto', indep: 'Netto jaarinkomen van de zelfstandige',
    rowGross: 'Brutoloon', rowOnss: 'Persoonlijke RSZ-bijdragen (13,07 %)', rowBonus: 'Sociale werkbonus', rowImposable: 'Belastbaar loon', rowPp: 'Bedrijfsvoorheffing',
    rowFiscal: 'waarvan vermindering fiscale werkbonus', rowCsss: 'Bijzondere bijdrage sociale zekerheid', rowGroup: 'Groepsverzekering', rowNet: 'Nettoloon',
    rowEmployer: 'Werkgeversbijdragen (25 %)', rowCostMonth: 'Kost per maand', rowCostYear: 'Kost per jaar (13 maanden + dubbel vakantiegeld)', rowAmount: 'Brutobedrag', rowRate: 'Voorheffingspercentage',
    rowContrib: 'Sociale bijdragen RSVZ', rowQuarter: 'Per kwartaal', rowTax: 'Geschatte personenbelasting', rowTaxable: 'Belastbaar inkomen',
    note: 'Sleutelformule FOD Financiën 2026, RSZ 13,07 %, werkbonus vanaf 1 september 2026. Schatting: je loonfiche is bepalend.',
    copy: 'Resultaat kopiëren', copied: 'Gekopieerd', print: 'Afdrukken', how: 'Berekeningsmethode', bar: 'Verdeling van het brutoloon', legend: ['Netto', 'RSZ', 'Voorheffing', 'BBSZ'],
  },
};

export default function BeCalculator({ mode = 'brutNet', lang = 'fr', initialGross = 3500, initialHourly = 20, methodHref }: Props) {
  const t = S[lang];
  const m = (v: number, d = 2) => formatMoney(v, d, lang);
  const sp = new URLSearchParams(); // premier rendu = HTML du build (RECETTE §17.5)
  const [gross, setGross] = useState(num(sp, 'b', initialGross));
  const [net, setNet] = useState(num(sp, 'n', 2500));
  const [hourly, setHourly] = useState(num(sp, 'h', initialHourly));
  const [hours, setHours] = useState(num(sp, 'hs', 38));
  const [status, setStatus] = useState<Status>(str(sp, 's', 'employe') as Status);
  const [situation, setSituation] = useState<Situation>(str(sp, 'f', 'isole') as Situation);
  const [children, setChildren] = useState(num(sp, 'e', 0));
  const [parent, setParent] = useState(str(sp, 'pi', '0'));
  const [group, setGroup] = useState(num(sp, 'g', 0));
  const [communal, setCommunal] = useState(num(sp, 'c', 7));
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const u = readParams(window.location.search);
    setGross(num(u, 'b', initialGross)); setNet(num(u, 'n', 2500)); setHourly(num(u, 'h', initialHourly)); setHours(num(u, 'hs', 38));
    setStatus(str(u, 's', 'employe') as Status); setSituation(str(u, 'f', 'isole') as Situation); setChildren(num(u, 'e', 0)); setParent(str(u, 'pi', '0'));
    setGroup(num(u, 'g', 0)); setCommunal(num(u, 'c', 7));
  }, []);
  const base = { status, situation, children, parentIsole: parent === '1', groupInsurance: group };
  const effGross = mode === 'netBrut' ? grossForNet(net, base) : mode === 'horaire' ? hourlyToMonthly(hourly, hours) : gross;
  const r = useMemo(() => compute({ gross: effGross, ...base }), [effGross, status, situation, children, parent, group]);
  const dp = useMemo(() => doublePecule({ gross, ...base }), [gross, status, situation, children, parent, group]);
  const yb = useMemo(() => yearEndBonus({ gross, ...base }), [gross, status, situation, children, parent, group]);
  const ec = useMemo(() => employerCost(gross), [gross]);
  const se = useMemo(() => selfEmployed(gross, communal / 100), [gross, communal]);
  useEffect(() => { updateURL({ b: ['netBrut', 'horaire'].includes(mode) ? undefined : gross, n: mode === 'netBrut' ? net : undefined, h: mode === 'horaire' ? hourly : undefined, hs: mode === 'horaire' && hours !== 38 ? hours : undefined, s: status === 'employe' ? undefined : status, f: situation === 'isole' ? undefined : situation, e: children || undefined, pi: parent === '1' ? 1 : undefined, g: group || undefined, c: mode === 'independant' && communal !== 7 ? communal : undefined }); }, [gross, net, hourly, hours, status, situation, children, parent, group, communal, mode]);

  const head = (() => {
    switch (mode) {
      case 'pp': return { l: t.ppMonth, v: m(r.pp), s: `${t.rowImposable} ${m(r.imposable)} · ${formatPercent(r.pp / Math.max(1, r.imposable), 1, lang)}` };
      case 'netBrut': return { l: t.grossNeeded, v: m(effGross), s: `${t.rowNet} ${m(net)}` };
      case 'cout': return { l: t.cost, v: m(ec.monthly), s: `${t.rowCostYear} : ${m(ec.annual, 0)}` };
      case 'pecule': return { l: t.pecule, v: m(dp.net), s: `${t.rowAmount} ${m(dp.amount)} · ${t.rowRate} ${formatPercent(dp.rate, 2, lang)}` };
      case 'prime': return { l: t.prime, v: m(yb.net), s: `${t.rowAmount} ${m(yb.amount)} · ${t.rowRate} ${formatPercent(yb.rate, 2, lang)}` };
      case 'independant': return { l: t.indep, v: m(se.net, 0), s: `${t.rowContrib} ${m(se.contributions, 0)} · ${t.rowTax} ${m(se.tax, 0)}` };
      case 'horaire': return { l: t.netMonth, v: m(r.net), s: `${m(effGross)} ${lang === "fr" ? "brut" : "bruto"} · ${hours} h` };
      default: return { l: t.netMonth, v: m(r.net), s: `${m(r.gross)} − ${m(r.onssNet)} − ${m(r.pp)} − ${m(r.csss)}` };
    }
  })();
  const copy = async () => { try { await navigator.clipboard.writeText(`${head.l}: ${head.v}\n${window.location.href}`); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* indisponible */ } };
  const salaryModes: Mode[] = ['brutNet', 'pp', 'horaire', 'netBrut', 'pecule', 'prime'];

  return (
    <div data-chrome className="rechner rounded-xl border border-navy-200 bg-navy-50 p-4 sm:p-6">
      <div className="grid gap-6 lg:grid-cols-5">
        <form className="space-y-4 lg:col-span-2" onSubmit={(e) => e.preventDefault()}>
          {mode === 'netBrut' ? <NumberField id="n" lang={lang} label={t.net} value={net} onChange={setNet} unit="€" max={50000} decimals={2} />
            : mode === 'horaire' ? (
              <div className="grid grid-cols-2 gap-3">
                <NumberField id="h" lang={lang} label={t.hourly} value={hourly} onChange={setHourly} unit="€" max={500} decimals={2} />
                <NumberField id="hs" lang={lang} label={t.hours} value={hours} onChange={setHours} unit="h" max={50} decimals={1} />
              </div>)
            : <NumberField id="b" lang={lang} label={mode === 'independant' ? t.profit : t.gross} value={gross} onChange={setGross} unit="€" max={mode === 'independant' ? 2000000 : 50000} decimals={2} help={mode === 'independant' ? undefined : t.grossHelp} />}
          {salaryModes.includes(mode) && <>
            <div className="grid grid-cols-2 gap-3">
              <SelectField id="s" label={t.status} value={status} onChange={(v) => setStatus(v as Status)} options={[{ value: 'employe', label: t.employe }, { value: 'ouvrier', label: t.ouvrier }]} />
              <NumberField id="e" lang={lang} label={t.children} value={children} onChange={setChildren} max={12} />
            </div>
            <SelectField id="f" label={t.situation} value={situation} onChange={(v) => setSituation(v as Situation)} options={[{ value: 'isole', label: t.isole }, { value: 'conjoint_revenus', label: t.conjR }, { value: 'conjoint_sans', label: t.conjS }]} />
            <div className="grid grid-cols-2 gap-3">
              <Toggle id="pi" label={t.parent} options={[{ value: '0', label: t.no }, { value: '1', label: t.yes }]} value={parent} onChange={setParent} />
              <NumberField id="g" lang={lang} label={t.group} value={group} onChange={setGroup} unit="€" max={2000} decimals={2} />
            </div>
          </>}
          {mode === 'independant' && <NumberField id="c" lang={lang} label={t.communal} value={communal} onChange={setCommunal} unit="%" max={12} decimals={1} />}
          <p className="text-xs text-navy-500">{t.free}</p>
        </form>
        <div className="lg:col-span-3" aria-live="polite">
          <div className="rounded-lg border border-accent-200 bg-white p-5">
            <div className="mb-4 text-center">
              <p className="text-sm font-medium text-navy-500">{head.l}</p>
              <p className="tabular-nums mt-1 text-4xl font-bold text-navy-900 sm:text-5xl">{head.v}</p>
              <p className="tabular-nums mt-1 text-sm text-navy-500">{head.s}</p>
            </div>
            {mode === 'cout' ? (
              <table className="mt-2 w-full text-sm"><tbody className="divide-y divide-navy-100">
                <Row l={t.rowGross} v={m(gross)} />
                <Row l={t.rowEmployer} v={m(ec.contributions)} />
                <Row l={t.rowCostMonth} v={m(ec.monthly)} bold accent />
                <Row l={t.rowCostYear} v={m(ec.annual)} />
              </tbody></table>
            ) : mode === 'pecule' || mode === 'prime' ? (
              <table className="mt-2 w-full text-sm"><tbody className="divide-y divide-navy-100">
                <Row l={t.rowAmount} v={m((mode === 'pecule' ? dp : yb).amount)} />
                <Row l={t.rowOnss} v={`− ${m((mode === 'pecule' ? dp : yb).onss)}`} />
                <Row l={`${t.rowPp} (${formatPercent((mode === 'pecule' ? dp : yb).rate, 2, lang)})`} v={`− ${m((mode === 'pecule' ? dp : yb).pp)}`} />
                <Row l={t.rowNet} v={m((mode === 'pecule' ? dp : yb).net)} bold accent />
              </tbody></table>
            ) : mode === 'independant' ? (
              <table className="mt-2 w-full text-sm"><tbody className="divide-y divide-navy-100">
                <Row l={t.profit} v={m(se.profit, 0)} />
                <Row l={t.rowContrib} v={`− ${m(se.contributions, 0)}`} />
                <Row l={t.rowQuarter} v={m(se.quarterly)} />
                <Row l={t.rowTaxable} v={m(se.taxable, 0)} />
                <Row l={t.rowTax} v={`− ${m(se.tax, 0)}`} />
                <Row l={t.indep} v={m(se.net, 0)} bold accent />
              </tbody></table>
            ) : (<>
              <StackedBar ariaPrefix={t.bar} total={r.gross} segments={[
                { label: t.legend[0], value: r.net, color: '#15803d' },
                { label: t.legend[1], value: r.onssNet, color: '#94a3b8' },
                { label: t.legend[2], value: r.pp, color: '#334155' },
                { label: t.legend[3], value: r.csss, color: '#b45309' },
              ]} />
              <table className="mt-4 w-full text-sm"><tbody className="divide-y divide-navy-100">
                <Row l={t.rowGross} v={m(r.gross)} />
                <Row l={t.rowOnss} v={`− ${m(r.onss)}`} />
                {r.bonus > 0 && <Row l={t.rowBonus} v={`+ ${m(r.bonus)}`} />}
                <Row l={t.rowImposable} v={m(r.imposable)} />
                <Row l={t.rowPp} v={`− ${m(r.pp)}`} />
                {r.fiscalBonus > 0 && <Row l={t.rowFiscal} v={m(r.fiscalBonus)} />}
                <Row l={t.rowCsss} v={`− ${m(r.csss)}`} />
                {group > 0 && <Row l={t.rowGroup} v={`− ${m(group)}`} />}
                <Row l={t.rowNet} v={m(r.net)} bold accent />
              </tbody></table>
            </>)}
            <p className="mt-3 text-xs text-navy-500">{t.note}</p>
            <div className="no-print mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={copy} className="rounded-lg border border-navy-300 bg-white px-3 py-1.5 text-sm font-medium text-navy-700 hover:bg-navy-50">{copied ? t.copied : t.copy}</button>
              <button type="button" onClick={() => window.print()} className="rounded-lg border border-navy-300 bg-white px-3 py-1.5 text-sm font-medium text-navy-700 hover:bg-navy-50">{t.print}</button>
              {methodHref && <a href={methodHref} className="ml-auto self-center text-sm text-accent-700 hover:underline">{t.how}</a>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function Row({ l, v, bold = false, accent = false }: { l: string; v: string; bold?: boolean; accent?: boolean }) { return <tr className={bold ? 'font-semibold' : ''}><td className={`py-2 pr-3 ${accent ? 'text-accent-700' : 'text-navy-600'}`}>{l}</td><td className={`tabular-nums whitespace-nowrap py-2 text-right ${accent ? 'text-accent-700' : 'text-navy-900'}`}>{v}</td></tr>; }
