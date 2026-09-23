// Saved costs are snapshots: catalog price changes never rewrite a project's budget.
export function addRentalCosts(state, project, uid = () => crypto.randomUUID()) {
  for (const equipment of state.equipment) {
    if (equipment.ownership !== 'rented' || !project.equipmentIds.includes(equipment.id)) continue;
    if (state.costs.some(cost => cost.projectId === project.id && cost.rentalEquipmentId === equipment.id)) continue;
    if (!(equipment.rentalRate > 0)) continue;
    state.costs.push({id:uid(),name:`Aluguel · ${equipment.name} · ${project.rentalDays} diária(s)`,category:'Locação',projectId:project.id,rentalEquipmentId:equipment.id,value:Math.round(equipment.rentalRate*project.rentalDays*100)/100,date:project.captureDates[0] || project.date || '',paid:false});
  }
}
