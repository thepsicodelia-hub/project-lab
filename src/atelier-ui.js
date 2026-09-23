import { inventoryVector,inventoryCategory } from './inventory-identity.js';
/** Original code-native illustrations. They are category drawings, not product photos. */
export function projectArtwork(stage = 0) {
  const frames = [
    '<rect x="85" y="20" width="205" height="205" rx="34" transform="rotate(-20 187 122)"/><rect x="143" y="-28" width="205" height="205" rx="34" transform="rotate(16 245 74)"/>',
    '<circle cx="220" cy="105" r="115"/><circle cx="220" cy="105" r="72"/><circle cx="220" cy="105" r="32"/>',
    '<path d="M95 180 190 15l95 165Z"/><path d="M175 205 270 40l95 165Z"/>',
    '<rect x="145" y="-15" width="125" height="230" rx="62" transform="rotate(28 200 100)"/><rect x="224" y="-15" width="125" height="230" rx="62" transform="rotate(28 286 100)"/>',
  ];
  return `<svg class="atelier-project-art" viewBox="0 0 400 220" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.2">${frames[stage % 4]}</svg>`;
}

export function equipmentArtwork(category, id = 'item') {
  const key = 'metal-' + String(id).replace(/[^a-z0-9-]/gi, '');
  const monitor = /edição/i.test(category);
  const lens = /lente/i.test(category);
  const audio = /áudio|audio|microfone/i.test(category);
  const light = /iluminação|luz/i.test(category);
  const stabilizer = /estabilização/i.test(category);
  const drawing = stabilizer
    ? `<rect x="95" y="35" width="83" height="43" rx="8" fill="url(#${key})" stroke="#818b99"/><circle cx="160" cy="57" r="15" fill="#455263" stroke="#a3b0bf"/><path d="M84 50v47h118V57m-59 40v36h37" fill="none" stroke="#8e98a6" stroke-width="12" stroke-linejoin="round"/><circle cx="143" cy="97" r="14" fill="url(#${key})" stroke="#748091"/><rect x="165" y="119" width="24" height="58" rx="8" fill="#596575"/><path d="m177 177-31 29m31-29 31 29m-31-29v32" stroke="#778393" stroke-width="5" stroke-linecap="round"/>`
    : monitor
    ? `<path d="m146 173-7 25h46l-7-25" fill="url(#${key})"/><rect x="58" y="31" width="208" height="143" rx="10" fill="url(#${key})" stroke="#a9afb8"/><rect x="64" y="37" width="196" height="119" rx="5" fill="#282e38"/><path d="M82 126h37V76h38v50h36V94h49" fill="none" stroke="#aab5c6" stroke-width="3"/><path d="M137 202h50" stroke="#888f99" stroke-width="5" stroke-linecap="round"/>`
    : lens
      ? `<ellipse cx="158" cy="175" rx="73" ry="15" fill="#c8cbd1" opacity=".35"/><rect x="104" y="65" width="113" height="111" rx="16" fill="url(#${key})" stroke="#7d8590"/><path d="M105 88h112M105 98h112M105 108h112M105 118h112M105 150h112" stroke="#747d89"/><ellipse cx="160" cy="64" rx="57" ry="25" fill="#474f5c" stroke="#8e97a4"/><ellipse cx="160" cy="64" rx="40" ry="18" fill="#252c37"/><ellipse cx="160" cy="64" rx="27" ry="11" fill="#576678"/><ellipse cx="153" cy="60" rx="16" ry="5" fill="#becbda" opacity=".5"/>`
      : audio
        ? `<rect x="140" y="27" width="47" height="112" rx="24" fill="url(#${key})" stroke="#8b939e"/><path d="M140 54h47M140 65h47M140 76h47M140 87h47M140 98h47M163 28v82M151 32v78M175 32v78" stroke="#858e9a"/><path d="M124 99v22a39 39 0 0 0 78 0V99m-39 61v30m-30 4h60" stroke="#6d7785" stroke-width="5" fill="none" stroke-linecap="round"/>`
        : light
          ? `<path d="m163 146-34 53m34-53 34 53m-34-62v66" stroke="#707a88" stroke-width="4"/><rect x="92" y="28" width="142" height="114" rx="14" fill="url(#${key})" stroke="#8b939e"/><rect x="101" y="37" width="124" height="96" rx="9" fill="#fbfbfa"/><path d="M103 52h121M103 67h121M103 82h121M103 97h121M103 112h121" stroke="#d8dce1"/>`
          : `<path d="m118 69 12-20h66l13 20" fill="url(#${key})" stroke="#838c99"/><rect x="63" y="69" width="204" height="109" rx="20" fill="url(#${key})" stroke="#838c99"/><rect x="77" y="78" width="40" height="91" rx="12" fill="#6f7885"/><circle cx="184" cy="123" r="49" fill="#485261" stroke="#a5adb8" stroke-width="4"/><circle cx="184" cy="123" r="36" fill="#273341" stroke="#748295" stroke-width="2"/><circle cx="184" cy="123" r="23" fill="#546577"/><path d="M166 111a23 23 0 0 1 31-7" fill="none" stroke="#b4c4d6" stroke-width="6" opacity=".55"/><rect x="228" y="80" width="21" height="9" rx="3" fill="#d9dde3"/><circle cx="247" cy="100" r="3" fill="#525c6b"/>`;
  return `<svg class="atelier-equipment-art" viewBox="0 0 330 220" aria-hidden="true"><defs><linearGradient id="${key}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f5f6f8"/><stop offset=".42" stop-color="#c1c6ce"/><stop offset="1" stop-color="#8993a1"/></linearGradient></defs>${drawing}</svg>`;
}

export function equipmentCategory(category='') {
  return inventoryCategory(category);
}
export function equipmentCard(e, m, {esc, money, btn, canEdit}) {
  const category=equipmentCategory(e.category);
  const card = `<article class="atelier-equipment clean-equipment" data-equipment-category="${category}"><header class="clean-equipment-heading"><span class="clean-equipment-icon">${inventoryVector(category)}</span><div><span class="clean-category">${esc(e.category)}</span><h3>${esc(e.name)}</h3></div></header><div class="atelier-equipment-body"><div class="atelier-equipment-price"><div><span>Investimento</span><strong>${money(e.value)}</strong></div><div><span>Custo por diária</span><strong>${money(m.dailyCost)}</strong></div></div><div class="atelier-recovery"><div><span>Amortização por uso</span><strong>${m.amortizedPercent.toFixed(1).replace('.', ',')}%</strong></div><div class="mini-progress"><span style="width:${m.amortizedPercent}%"></span></div><p>${m.days} diárias de ${e.life} estimadas</p></div><details class="atelier-equipment-details"><summary>Entender o retorno</summary><p>${money(m.amortized)} amortizados por uso (estimativa).</p><p>${money(m.revenue)} em receitas atribuídas · ${m.recovered.toFixed(1).replace('.', ',')}% da compra.</p><p>${e.value > 0 && m.revenue >= e.value ? 'Compra coberta pelas receitas registradas.' : 'Amortização por uso não comprova retorno financeiro.'}</p></details><div class="ops-actions">${e.ownership === 'rented' ? '' : btn('Registrar uso', 'ops:equipment:' + e.id, 'plus', 'small')}${canEdit() ? btn('Editar', 'ops:edit:equipment:' + e.id, 'settings', 'small') + btn('Excluir', 'ops:delete:equipment:' + e.id, 'x', 'small danger') : ''}</div></div></article>`;
  if (e.ownership !== 'rented') return card;
  return card.replace(/<div class="atelier-equipment-price">[\s\S]*?<div class="ops-actions">/, `<div class="atelier-equipment-price"><div><span>Alugado · diária de referência</span><strong>${money(e.rentalRate)}</strong></div></div><p>Selecione este item no projeto para lançar o aluguel como custo pendente.</p><div class="ops-actions">`);
}
