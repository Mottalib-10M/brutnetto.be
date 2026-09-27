/** Exemples chiffrés : toujours produits par le moteur (RECETTE §4). */
import { compute, type Input } from './engine/be';
import P from '../data/params-2026.json';
export { P };
export const ex = (gross: number, o: Omit<Input, 'gross'> = {}) => compute({ gross, ...o });
