function chips(items) {
  return Array.isArray(items) && items.length
    ? `<div class="chips">${items.map((item) => `<span class="chip">${esc(item)}</span>`).join('')}</div>`
    : '<p class="meta">No dependable information found.</p>';
}

function textPanel(title, text) {
  if (!text) return '';
  return `<section class="panel"><h3 class="panel-title">${esc(title)}</h3><p>${esc(text)}</p></section>`;
}

function listPanel(title, items, className = '') {
  if (!Array.isArray(items) || !items.length) return '';
  return `<section class="panel ${className}"><h3 class="panel-title">${esc(title)}</h3>${items.map((item) => `<div class="${className === 'conflicts' ? 'conflict' : 'note'}">${esc(item)}</div>`).join('')}</section>`;
}

function sourcePanel(sources) {
  if (!Array.isArray(sources) || !sources.length) return '';
  return `<section class="panel"><h3 class="panel-title">SOURCES</h3><div class="source-list">${sources.map((source) => `<a class="source-link" href="${esc(source.url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(source.title || source.publisher || 'Source')}</strong><span>${esc([source.publisher, source.source_type].filter(Boolean).join(' · '))}</span></a>`).join('')}</div></section>`;
}

function researchMarkup(profile) {
  if (!profile) return `<section class="panel"><h3 class="panel-title">RESEARCH PROFILE</h3><p>No sourced profile has been saved yet.</p><button id="emptyResearch" class="button primary full" style="margin-top:10px">Research this strain</button></section>`;
  return `
    <section class="panel"><h3 class="panel-title">ALIASES</h3>${chips(profile.aliases)}</section>
    ${textPanel('EXACT CROSS', profile.exact_cross)}
    ${textPanel('EXPANDED LINEAGE', profile.expanded_lineage)}
    ${textPanel('HISTORY', profile.history)}
    ${textPanel('PROVENANCE / SOURCE', profile.provenance || profile.source_or_cut)}
    ${listPanel('PARENT BACKGROUND', profile.parent_background)}
    ${listPanel('NOTABLE CUTS OR PHENOTYPES', profile.notable_cuts_or_phenotypes)}
    <section class="panel"><h3 class="panel-title">AROMA & FLAVOR</h3>${chips(profile.aroma_and_flavor)}</section>
    ${textPanel('CULTIVATION NOTES', profile.cultivation_notes)}
    ${listPanel('RELATED CULTIVARS', profile.related_cultivars)}
    ${listPanel('CONFLICTING OR UNVERIFIED CLAIMS', profile.conflicting_claims, 'conflicts')}
    ${textPanel('RESEARCH SUMMARY', profile.research_summary)}
    ${sourcePanel(profile.sources)}
    <section class="panel"><h3 class="panel-title">RESEARCH STATUS</h3><p>${esc((profile.confidence || 'unknown').toUpperCase())} confidence · ${esc(dateText(profile.researched_at))}</p></section>`;
}

async function loadPhotos(strainId) {
  const result = await db.from('strain_photos').select('*').eq('strain_id', strainId).order('created_at', { ascending: false });
  const urls = [];
  for (const photo of result.data || []) {
    const signed = await db.storage.from('strain-images').createSignedUrl(photo.storage_path, 3600);
    if (signed.data?.signedUrl) urls.push(signed.data.signedUrl);
  }
  return urls;
}

async function openDetail(id) {
  currentStrain = strains.find((item) => item.id === id);
  if (!currentStrain) return;
  show('detailModal');
  $('detailContent').innerHTML = '<div class="loading"><div><div class="spinner"></div><p>Opening profile…</p></div></div>';
  const [notesResult, photos] = await Promise.all([
    db.from('strain_notes').select('*').eq('strain_id', id).order('created_at', { ascending: false }),
    loadPhotos(id)
  ]);
  const profile = profileFor(id);
  const ordinaryNotes = (notesResult.data || []).filter((note) => !note.note_text.startsWith(RESEARCH_PREFIX));
  const creator = profile?.breeder_or_creator || currentStrain.breeder || 'Unknown source';
  const cross = profile?.exact_cross || currentStrain.cross_name || 'Not researched';

  $('researchCurrent').textContent = profile ? 'Refresh research' : 'Research';
  $('detailContent').innerHTML = `<div class="detail-hero">
    <p class="eyebrow" style="color:#cce4d2">${esc(creator)}</p>
    <h2>${esc(currentStrain.name)}</h2>
    <div class="crossline">${esc(cross)}</div>
  </div>
  <div class="detail-body">
    ${researchMarkup(profile)}
    ${currentStrain.general_notes ? textPanel('OWNER NOTES', currentStrain.general_notes) : ''}
    <section class="panel"><h3 class="panel-title">PHOTOS</h3><div class="photo-grid">${photos.map((url) => `<img src="${url}" alt="${esc(currentStrain.name)}">`).join('')}</div><label class="button secondary full" style="display:block;text-align:center;margin-top:8px">Add photo<input id="photoInput" type="file" accept="image/*" capture="environment" hidden></label></section>
    <section class="panel"><h3 class="panel-title">PERSONAL NOTES</h3>${ordinaryNotes.map((note) => `<div class="note"><small>${esc(dateText(note.created_at))}</small>${esc(note.note_text)}</div>`).join('')}<button id="addNote" class="button secondary full" style="margin-top:8px">Add note</button></section>
    <details class="panel tracking"><summary>Optional tracking</summary><div class="tracking-controls"><button id="minusCount">−</button><input id="countInput" type="number" min="0" value="${currentStrain.current_count || 0}"><button id="plusCount">+</button></div><div class="chips" style="margin-top:10px">${TRACKING_TAGS.map((tag) => `<button class="chip tag-button" data-tag="${esc(tag)}" style="border:${(currentStrain.tags || []).includes(tag) ? '2px solid var(--forest)' : '0'}">${esc(tag)}</button>`).join('')}</div></details>
    <button id="deleteStrain" class="button danger full">Remove strain</button>
  </div>`;

  $('emptyResearch')?.addEventListener('click', () => runResearch(currentStrain.name, '', currentStrain.id));
  $('addNote').onclick = async () => {
    const note = prompt('Add a note');
    if (!note?.trim()) return;
    const result = await db.from('strain_notes').insert({ owner_id: ownerId(), strain_id: id, note_text: note.trim() });
    if (result.error) alert(result.error.message); else openDetail(id);
  };
  $('photoInput').onchange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    status('Uploading photo…');
    const path = `${ownerId()}/${id}/${Date.now()}-${file.name}`;
    const upload = await db.storage.from('strain-images').upload(path, file, { contentType: file.type || 'image/jpeg' });
    if (upload.error) return alert(upload.error.message);
    const record = await db.from('strain_photos').insert({ owner_id: ownerId(), strain_id: id, storage_path: path });
    if (record.error) alert(record.error.message); else { status('Synced'); openDetail(id); }
  };
  const updateCount = async (value) => {
    const next = Math.max(0, Number(value) || 0);
    const result = await db.from('strains').update({ current_count: next }).eq('id', id);
    if (result.error) alert(result.error.message); else { currentStrain.current_count = next; loadLibrary(); openDetail(id); }
  };
  $('minusCount').onclick = () => updateCount((currentStrain.current_count || 0) - 1);
  $('plusCount').onclick = () => updateCount((currentStrain.current_count || 0) + 1);
  $('countInput').onchange = (event) => updateCount(event.target.value);
  document.querySelectorAll('.tag-button').forEach((button) => button.onclick = async () => {
    const tags = [...(currentStrain.tags || [])];
    const index = tags.indexOf(button.dataset.tag);
    if (index >= 0) tags.splice(index, 1); else tags.push(button.dataset.tag);
    const result = await db.from('strains').update({ tags }).eq('id', id);
    if (result.error) alert(result.error.message); else { currentStrain.tags = tags; loadLibrary(); openDetail(id); }
  });
  $('deleteStrain').onclick = async () => {
    if (!confirm(`Remove ${currentStrain.name}?`)) return;
    await db.from('strains').delete().eq('id', id);
    hide('detailModal');
    loadLibrary();
  };
}

function openStrainForm(strain = null) {
  currentStrain = strain;
  $('strainModalTitle').textContent = strain ? 'Edit strain' : 'Add strain';
  $('strainId').value = strain?.id || '';
  $('strainName').value = strain?.name || '';
  $('sourceHints').value = '';
  $('manualBreeder').value = strain?.breeder || '';
  $('manualCross').value = strain?.cross_name || '';
  $('manualLineage').value = strain?.lineage || '';
  $('manualFlavors').value = (strain?.flavors || []).join(', ');
  $('manualNotes').value = strain?.general_notes || '';
  $('manualCount').value = strain?.current_count || 0;
  $('researchFromForm').textContent = strain ? 'Research & update' : 'Research & add';
  show('strainModal');
}

async function saveManualStrain() {
  const name = $('strainName').value.trim();
  if (!name) return alert('Enter a strain name.');
  const row = {
    name,
    breeder: $('manualBreeder').value.trim() || 'Unknown',
    cross_name: $('manualCross').value.trim() || 'Not researched',
    lineage: $('manualLineage').value.trim() || $('manualCross').value.trim() || 'Not researched',
    flavors: $('manualFlavors').value.split(',').map((item) => item.trim()).filter(Boolean),
    general_notes: $('manualNotes').value.trim(),
    current_count: Math.max(0, Number($('manualCount').value) || 0),
    status: $('strainId').value ? currentStrain?.status || 'Owner updated' : 'Owner added'
  };
  const id = $('strainId').value;
  const result = id
    ? await db.from('strains').update(row).eq('id', id)
    : await db.from('strains').insert({ ...row, owner_id: ownerId(), tags: [] });
  if (result.error) return alert(result.error.message);
  hide('strainModal');
  hide('detailModal');
  loadLibrary();
}

function renderResearchPreview(profile) {
  $('researchPreview').innerHTML = `<section class="preview-hero"><span class="confidence">${esc(profile.confidence || 'unknown')} confidence</span><h2>${esc(profile.canonical_name || pendingName)}</h2><p>${esc(profile.research_summary || '')}</p></section>
    ${textPanel('BREEDER / CREATOR', profile.breeder_or_creator)}
    ${textPanel('SOURCE OR CUT', profile.source_or_cut)}
    ${textPanel('EXACT CROSS', profile.exact_cross)}
    ${textPanel('EXPANDED LINEAGE', profile.expanded_lineage)}
    ${textPanel('HISTORY', profile.history)}
    ${textPanel('PROVENANCE', profile.provenance)}
    ${listPanel('PARENT BACKGROUND', profile.parent_background)}
    ${listPanel('NOTABLE CUTS OR PHENOTYPES', profile.notable_cuts_or_phenotypes)}
    <section class="panel"><h3 class="panel-title">AROMA & FLAVOR</h3>${chips(profile.aroma_and_flavor)}</section>
    ${textPanel('CULTIVATION NOTES', profile.cultivation_notes)}
    ${listPanel('RELATED CULTIVARS', profile.related_cultivars)}
    ${listPanel('CONFLICTING OR UNVERIFIED CLAIMS', profile.conflicting_claims, 'conflicts')}
    ${sourcePanel(profile.sources)}`;
}

async function runResearch(name, hints = '', targetId = null) {
  name = String(name || '').trim();
  if (!name) return alert('Enter a strain name.');
  pendingTargetId = targetId;
  pendingName = name;
  pendingProfile = null;
  show('researchModal');
  $('applyResearch').disabled = true;
  $('researchPreview').innerHTML = '<div class="loading"><div><div class="spinner"></div><h2>Researching the strain</h2><p>Checking breeder, creator, lineage, history, aliases, cultivation reports, and sources…</p></div></div>';
  const existingStrain = targetId ? strains.find((item) => item.id === targetId) : null;
  const existingProfile = targetId ? profileFor(targetId) : null;

  try {
    const response = await fetch('/api/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({
        name,
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
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Research failed.');
    pendingProfile = data.profile;
    renderResearchPreview(pendingProfile);
    $('applyResearch').disabled = false;
  } catch (error) {
    $('researchPreview').innerHTML = `<section class="panel"><h2>Research could not run</h2><p>${esc(error.message)}</p><button id="retryResearch" class="button primary full" style="margin-top:10px">Try again</button></section>`;
    $('retryResearch').onclick = () => runResearch(name, hints, targetId);
  }
}

async function saveResearchNote(strainId, profile) {
  const old = await db.from('strain_notes').select('id,note_text').eq('strain_id', strainId).like('note_text', 'NUTT_RESEARCH_V2%');
  for (const note of old.data || []) await db.from('strain_notes').delete().eq('id', note.id);
  const insert = await db.from('strain_notes').insert({ owner_id: ownerId(), strain_id: strainId, note_text: RESEARCH_PREFIX + JSON.stringify(profile) });
  if (insert.error) throw insert.error;
}

async function applyPendingResearch() {
  if (!pendingProfile) return;
  $('applyResearch').disabled = true;
  $('applyResearch').textContent = 'Saving…';
  try {
    let strainId = pendingTargetId;
    const row = {
      breeder: pendingProfile.breeder_or_creator || 'Unverified',
      cross_name: pendingProfile.exact_cross || 'Not publicly verified',
      lineage: pendingProfile.expanded_lineage || pendingProfile.exact_cross || 'Not publicly verified',
      flavors: pendingProfile.aroma_and_flavor || [],
      status: `Sourced research · ${pendingProfile.confidence || 'unknown'} · ${dateText(pendingProfile.researched_at)}`
    };
    if (strainId) {
      const update = await db.from('strains').update(row).eq('id', strainId);
      if (update.error) throw update.error;
    } else {
      const insert = await db.from('strains').insert({
        owner_id: ownerId(),
        name: $('strainName').value.trim() || pendingProfile.canonical_name || pendingName,
        current_count: Math.max(0, Number($('manualCount').value) || 0),
        tags: [],
        general_notes: $('manualNotes').value.trim(),
        ...row
      }).select('id').single();
      if (insert.error) throw insert.error;
      strainId = insert.data.id;
    }
    await saveResearchNote(strainId, pendingProfile);
    hide('researchModal');
    hide('strainModal');
    hide('detailModal');
    await loadLibrary();
    await openDetail(strainId);
  } catch (error) {
    alert(error.message);
  } finally {
    $('applyResearch').disabled = false;
    $('applyResearch').textContent = 'Save';
  }
}

function setPage(page) {
  activePage = page;
  const ids = { library: 'libraryPage', breeding: 'breedingPage', seeds: 'seedsPage', more: 'morePage' };
  Object.entries(ids).forEach(([name, id]) => $(id).classList.toggle('hidden', name !== page));
  document.querySelectorAll('.bottom-nav button').forEach((button) => button.classList.toggle('active', button.dataset.page === page));
  $('searchTools').classList.toggle('hidden', page !== 'library');
  $('addButton').classList.toggle('hidden', page !== 'library');
  $('pageTitle').textContent = page === 'library' ? 'The Nutt Bank' : page[0].toUpperCase() + page.slice(1);
}

function configureSimpleModal(type) {
  if (type === 'project') {
    $('simpleTitle').textContent = 'Add breeding project';
    $('simpleFields').innerHTML = '<label>Project name</label><input id="pName"><label>Female / mother</label><input id="pFemale"><label>Male / pollen donor</label><input id="pMale"><label>Generation</label><input id="pGeneration"><label>Stage</label><input id="pStage"><label>Notes</label><textarea id="pNotes"></textarea>';
    $('simpleSave').onclick = async () => {
      const result = await db.from('breeding_projects').insert({ owner_id: ownerId(), name: $('pName').value.trim(), female_parent: $('pFemale').value.trim(), male_parent: $('pMale').value.trim(), generation: $('pGeneration').value.trim(), stage: $('pStage').value.trim(), notes: $('pNotes').value.trim(), plant_count: 0 });
      if (result.error) alert(result.error.message); else { hide('simpleModal'); loadLibrary(); }
    };
  } else {
    $('simpleTitle').textContent = 'Add seed entry';
    $('simpleFields').innerHTML = '<label>Strain / line</label><input id="seedName"><label>Breeder</label><input id="seedBreeder"><label>Packs</label><input id="seedPacks" type="number" min="0" value="1"><label>Seeds per pack</label><input id="seedsPerPack" type="number" min="0"><label>Notes</label><textarea id="seedNotes"></textarea>';
    $('simpleSave').onclick = async () => {
      const result = await db.from('seed_inventory').insert({ owner_id: ownerId(), name: $('seedName').value.trim(), breeder: $('seedBreeder').value.trim(), packs: Number($('seedPacks').value) || 0, seeds_per_pack: Number($('seedsPerPack').value) || 0, notes: $('seedNotes').value.trim() });
      if (result.error) alert(result.error.message); else { hide('simpleModal'); loadLibrary(); }
    };
  }
  show('simpleModal');
}
