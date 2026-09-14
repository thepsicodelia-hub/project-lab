/** Project Lab / Kit. Original 48-unit drawings, built for this inventory.
 * Shared geometry and optical weight; no brand marks, external icons or images.
 */
export const INVENTORY_CATEGORIES = Object.freeze([
  {id:'camera',label:'Câmeras',hint:'Corpos e câmeras de cinema'},
  {id:'lens',label:'Lentes',hint:'Ópticas para cada enquadramento'},
  {id:'audio',label:'Áudio',hint:'Microfones, gravadores e acessórios'},
  {id:'light',label:'Iluminação',hint:'Luzes e modificadores'},
  {id:'drone',label:'Drones',hint:'Equipamentos para imagens aéreas'},
  {id:'gimbal',label:'Estabilização',hint:'Gimbals e sistemas de apoio'},
  {id:'monitor',label:'Ilha de edição',hint:'Estações de pós-produção'},
  {id:'briefcase',label:'Outros',hint:'Os demais recursos do seu kit'},
]);

export const inventoryDrawings = Object.freeze({
  all:'<rect x="6" y="6" width="15" height="15" rx="4"/><rect x="27" y="6" width="15" height="15" rx="4"/><rect x="6" y="27" width="15" height="15" rx="4"/><rect x="27" y="27" width="15" height="15" rx="4"/><rect x="10" y="10" width="7" height="7" rx="2" fill="currentColor" fill-opacity=".16" stroke="none"/><path d="M31 34.5h7m-3.5-3.5v7"/>',
  camera:'<path d="M13 16v-5a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v5m-14-4h10M9 16h30a4 4 0 0 1 4 4v17a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V20a4 4 0 0 1 4-4Z"/><path d="M8 20h6v17H8" fill="currentColor" fill-opacity=".12" stroke="none"/><circle cx="28" cy="28.5" r="9"/><circle cx="28" cy="28.5" r="5"/><path d="M26 25a4 4 0 0 1 4 0M10 24v8m26-19h4m-2-2v5"/><circle cx="38" cy="21" r="1.2" fill="currentColor" stroke="none"/>',
  lens:'<path d="M11 12v24c0 4 5.8 7 13 7s13-3 13-7V12"/><ellipse cx="24" cy="12" rx="13" ry="7"/><ellipse cx="24" cy="12" rx="8" ry="3.5" fill="currentColor" fill-opacity=".12"/><path d="M11 21c6 5 20 5 26 0m-26 6c6 5 20 5 26 0m-26 8c6 5 20 5 26 0M16 26v3m5-2v3m6-3v3m5-4v3"/><path d="m20 10 8 4" opacity=".6"/>',
  audio:'<rect x="18" y="5" width="12" height="26" rx="6" fill="currentColor" fill-opacity=".09"/><path d="M18 13h12m-12 5h12m-12 5h12M12 24v2a12 12 0 0 0 24 0v-2M24 38v5m-7 0h14M7 15v8m34-8v8M3 17v4m42-4v4"/>',
  light:'<path d="m13 8-7-3v13m29-10 7-3v13M13 29l-7 3V19m29 10 7 3V19"/><rect x="11" y="8" width="26" height="22" rx="3"/><rect x="15" y="12" width="18" height="14" rx="1.5" fill="currentColor" fill-opacity=".13"/><path d="M24 30v13m0-8-9 8m9-8 9 8M20 16h8m-8 6h8m-4-6v6"/>',
  drone:'<path d="m17 19-7-9m21 9 7-9M17 29l-7 9m21-9 7 9" stroke-width="2.4"/><ellipse cx="10" cy="10" rx="7" ry="4"/><ellipse cx="38" cy="10" rx="7" ry="4"/><ellipse cx="10" cy="38" rx="7" ry="4"/><ellipse cx="38" cy="38" rx="7" ry="4"/><rect x="17" y="15" width="14" height="18" rx="5" fill="currentColor" fill-opacity=".1"/><path d="M21 20h6m-3 13v4"/><rect x="21" y="35" width="6" height="5" rx="1.5"/>',
  gimbal:'<rect x="10" y="7" width="20" height="13" rx="3"/><circle cx="22" cy="13.5" r="3.5"/><path d="M6 13v14h28V16m-14 11v5h10"/><circle cx="34" cy="13" r="4" fill="currentColor" fill-opacity=".14"/><circle cx="20" cy="27" r="3" fill="var(--panel)"/><rect x="27" y="28" width="7" height="14" rx="2.5" fill="currentColor" fill-opacity=".1"/><path d="m30.5 42-7 3m7-3 7 3"/>',
  monitor:'<rect x="4" y="6" width="40" height="28" rx="4"/><path d="M4 28h40M24 34v7m-8 0h16"/><rect x="8" y="10" width="18" height="14" rx="2" fill="currentColor" fill-opacity=".1"/><path d="m15 13 6 4-6 4Zm15-1h10m-10 5h7m-7 5h10"/><path d="M22 31h4"/>',
  briefcase:'<path d="M17 13V9a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4"/><rect x="5" y="13" width="38" height="29" rx="5"/><path d="M5 25h38M12 17v4m24-4v4M12 32v5m24-5v5"/><rect x="18" y="21" width="12" height="8" rx="2" fill="currentColor" fill-opacity=".12"/><path d="M21 25h6"/>',
});

export function inventoryVector(category='all') {
  const key=Object.hasOwn(inventoryDrawings,category)?category:'briefcase';
  return `<svg class="pl-icon inventory-vector" data-inventory-vector="${key}" viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inventoryDrawings[key]}</svg>`;
}

export function inventoryCategory(value='') {
  const category=String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  return /edicao|pos-producao|estacao|computador/.test(category)?'monitor'
    :/lente|optica|objetiva/.test(category)?'lens'
    :/iluminacao|luz|softbox|led/.test(category)?'light'
    :/audio|microfone|gravador/.test(category)?'audio'
    :/estabiliza|gimbal|tripe|monope/.test(category)?'gimbal'
    :/drone/.test(category)?'drone'
    :/camera/.test(category)?'camera':'briefcase';
}

export function inventoryGroups(items) {
  return INVENTORY_CATEGORIES.map(category=>({...category,items:items.filter(item=>inventoryCategory(item.category)===category.id)}));
}
