/** Calibrage des extraits au build (RECETTE §15) : titre 50–60, description 150–160, par langue. */
const DESC_TAILS: Record<string, string[]> = {
  fr: ['', ' Gratuit.', ' Gratuit, sans inscription.', ' Gratuit et anonyme.', ' Mis à jour pour 2026.', ' Gratuit, mis à jour pour 2026.'],
  nl: ['', ' Gratis.', ' Gratis, zonder registratie.', ' Gratis en anoniem.', ' Bijgewerkt voor 2026.', ' Gratis, bijgewerkt voor 2026.'],
};
const TITLE_TAILS: Record<string, string[]> = { fr: ['', ' | Belgique'], nl: ['', ' | België'] };
function fit(core: string, tails: string[], lo: number, hi: number, what: string): string {
  for (const t of tails) {
    // Pas de suffixe pays quand le titre le porte déjà (« Minimumloon België … | België »).
    const word = t.replace(/^[\s|·–-]+/, '').toLowerCase();
    if (word && core.toLowerCase().includes(word)) continue;
    const s = core + t; if (s.length >= lo && s.length <= hi) return s;
  }
  throw new Error(`${what} hors fenêtre ${lo}–${hi} (${core.length}) : « ${core} »`);
}
export const fitDescription = (d: string, lang = 'fr') => fit(d.trim(), DESC_TAILS[lang], 150, 160, 'Description');
export const fitTitle = (t: string, lang = 'fr') => fit(t.trim(), TITLE_TAILS[lang], 50, 60, 'Titre');
