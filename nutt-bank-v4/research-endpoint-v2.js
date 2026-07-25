async function requestCannabisResearch(queryName, originalName, hints, existingStrain, existingProfile) {
  const response = await fetch('https://nutt-bank-cannabis-research.vercel.app/api/research', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      name: originalName,
      requested_name: originalName,
      category: 'cannabis cultivar genetics',
      hints,
      existing: existingStrain ? {
        breeder: existingStrain.breeder,
        cross: existingStrain.cross_name,
        lineage: existingStrain.lineage,
        owner_notes: existingStrain.general_notes,
        saved_research: existingProfile
      } : null
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Cannabis strain research failed.');
  return data.profile;
}
