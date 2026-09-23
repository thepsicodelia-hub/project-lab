export function deleteProduction(state, id) {
  if (!state.projects.some(project => project.id === id)) return;
  const deliveries = new Set(state.projectDeliveries.filter(row => row.projectId === id).map(row => row.id));
  state.projects = state.projects.filter(row => row.id !== id);
  for (const key of ['projectDeliveries', 'projectMaterials', 'projectHours']) {
    state[key] = state[key].filter(row => row.projectId !== id);
  }
  state.deliveryFeedback = state.deliveryFeedback.filter(row => !deliveries.has(row.deliveryId));
  state.events = state.events.filter(row => !(row.projectId === id && row.id.startsWith('auto-')));
  // Preserve financial, task, manual calendar and creative history independently.
  for (const rows of Object.values(state)) {
    if (!Array.isArray(rows) || rows === state.equipmentLinks) continue;
    for (const row of rows) if (row && row.projectId === id) {
      row.projectId = '';
      if ('project' in row) row.project = '';
    }
  }
  // Equipment usage records remain as historical usage, preserving amortization.
}
