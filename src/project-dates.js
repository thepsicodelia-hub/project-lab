import { dateSchema } from './data.js';

export function parseCaptureDates(value = '') {
  return [...new Set(value.trim().split(/[\s,;]+/).filter(Boolean).map(raw => {
    const local = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    const date = local ? `${local[3]}-${local[2].padStart(2, '0')}-${local[1].padStart(2, '0')}` : raw;
    if (!dateSchema.safeParse(date).success) throw new Error(`Data de captação inválida: ${raw}. Use DD/MM/AAAA, por exemplo 23/09/2026.`);
    return date;
  }))];
}
