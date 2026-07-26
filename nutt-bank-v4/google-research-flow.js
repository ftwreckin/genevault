let pendingResearchFiles = [];

(function installGoogleResearchFlow() {
  const style = document.createElement('style');
  style.textContent = `
    .research-entry{max-width:720px;margin:0 auto;padding:18px 18px 100px}
    .research-entry h2{margin:0 0 6px;font-size:28px;letter-spacing:-.02em}
    .research-entry .intro{margin:0 0 18px;color:var(--muted);line-height:1.45}
    .google-search-button{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;border:1px solid var(--forest);background:var(--forest);color:#fff;text-decoration:none;font-weight:700;border-radius:4px;margin:0 0 18px}
    .research-entry label{display:block;font-weight:700;font-size:13px;margin:14px 0 6px}
    .research-entry textarea{min-height:190px;line-height:1.45}
    .field-row{display:grid;grid-template-columns:1fr;gap:10px}
    .research-image-preview{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:10px 0}
    .research-image-preview img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:3px;border:1px solid var(--line)}
    .editorial-profile{padding:22px 18px 110px;max-width:760px;margin:0 auto}
    .editorial-head{border-bottom:1px solid var(--line);padding-bottom:18px;margin-bottom:18px}
    .editorial-head h2{font-size:32px;line-height:1.05;margin:5px 0 9px;letter-spacing:-.025em}
    .editorial-lineage{font-size:18px;line-height:1.35;font-weight:700;color:var(--forest)}
    .editorial-breeder{margin-top:5px;color:var(--muted)}
    .editorial-images{display:grid;grid-template-columns:2fr 1fr 1fr;gap:5px;margin:0 0 20px}
    .editorial-images img{width:100%;height:120px;object-fit:cover;border-radius:3px;background:#e7e9e4}
    .editorial-images img:first-child{height:245px;grid-row:span 2}
    .editorial-section{padding:0 0 20px;margin:0 0 20px;border-bottom:1px solid var(--line)}
    .editorial-section h3{font-size:12px;letter-spacing:.08em;margin:0 0 8px;color:var(--forest)}
    .editorial-section p{font-size:17px;line-height:1.55;margin:0;white-space:pre-wrap}
    .fact-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0 0 20px}
    .fact{border-top:3px solid var(--forest);padding:9px 0 0}
    .fact span{display:block;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px}
    .fact strong{font-size:15px;line-height:1.3}
    .source-compact{display:block;padding:11px 0;border-bottom:1px solid var(--line);text-decoration:none;color:var(--text)}
    .source-compact strong{display:block;color:var(--forest);font-size:14px;line-height:1.3}
    .source-compact span{display:block;color:var(--muted);font-size:12px;margin-top:3px}
    .paste-helper{font-size:12px;color:var(--muted);line-height:1.4;margin-top:6px}
  `;
  document.head.appendChild(style);
})();

function googleResearchUrl(name) {
  return `https://www.google.com/search?q=${encodeURIComponent(`${name} cannabis strain breeder lineage history`)}`;
}

function cleanResearchText(value) {
  return String(value || '').replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
}

function extractBreederFromPaste(text) {
  const patterns = [
    /(?:bred|created|developed)\s+by\s+([^.,;\n]{2,70})/i,
    /(?:breeder|creator)\s*[:–—-]\s*([^.,;\n]{2,70})/i,
    /from\s+([^.,;\n]{2,55}\s+(?:Genetics|Seeds))/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return '';
}

function extractLineageFromPaste(text) {
  const patterns = [
    /(?:created|made|bred)\s+by\s+crossing\s+([^.,;\n]{2,70}?)\s+(?:and|with|x|×)\s+([^.,;\n]{2,70})/i,
    /(?:cross(?:ing)?|lineage|genetics)\s*[:–—-]?\s*([^.,;\n]{2,70}?)\s+(?:and|with|x|×)\s+([^.,;\n]{2,70})/i,
    /([A-Z][A-Za-z0-9#.'’\- ]{1,55}?)\s+(?:x|×)\s+([A-Z][A-Za-z0-9#.'’\- ]{1,55})(?=[.,;\n]|$)/
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return `${match[1].trim()} × ${match[2].trim()}`;
  }
  return '';
}

function conciseOverview(text) {
  const normalized = cleanResearchText(text).replace(/\n+/g, ' ');
  const sentences = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  return sentences.slice(0, 3).join(' ').trim();
}

function imagePreviewMarkup(files) {
  if (!files.length) return '';
  return `<div class="research-image-preview">${files.slice(0, 6).map((file) => `<img src="${URL.createObjectURL(file)}" alt="Selected strain reference">`).join('')}</div>`;
}

function editorialImageMarkup(profile) {
  const images = Array.isArray(profile?.external_images) ? profile.external_images.filter((item) => item?.url) : [];
  if (!images.length) return '';
  return `<div class="editorial-images">${images.slice(0, 5).map((item) => `<a href="${esc(item.source_url || item.url)}" target="_blank" rel="noopener noreferrer"><img src="${esc(item.url)}" alt="${esc(profile.canonical_name || 'Cultivar')}"></a>`).join('')}</div>`;
}

function compactSourceMarkup(sources) {
  if (!Array.isArray(sources) || !sources.length) return '';
  return `<div>${sources.map((source) => `<a class="source-compact" href="${esc(source.url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(source.title || source.publisher || 'Source')}</strong><span>${esc(source.publisher || '')}</span></a>`).join('')}</div>`;
}

researchMarkup = function researchMarkup(profile) {
  if (!profile) {
    return `<section class="panel"><h3 class="panel-title">RESEARCH</h3><p>No reference entry has been saved yet.</p><button id="emptyResearch" class="button primary full" style="margin-top:10px">Add research</button></section>`;
  }
  const overview = profile.overview || profile.research_summary || '';
  const history = profile.history || '';
  const aliases = Array.isArray(profile.aliases) ? profile.aliases : [];
  const flavors = Array.isArray(profile.aroma_and_flavor) ? profile.aroma_and_flavor : [];
  const conflicts = Array.isArray(profile.conflicting_claims) ? profile.conflicting_claims : [];
  return `
    ${editorialImageMarkup(profile)}
    <div class="fact-grid">
      <div class="fact"><span>Breeder / creator</span><strong>${esc(profile.breeder_or_creator || 'Not confirmed')}</strong></div>
      <div class="fact"><span>Lineage</span><strong>${esc(profile.exact_cross || 'Not confirmed')}</strong></div>
    </div>
    ${overview ? `<section class="editorial-section"><h3>OVERVIEW</h3><p>${esc(overview)}</p></section>` : ''}
    ${history && history !== overview ? `<section class="editorial-section"><h3>HISTORY & NOTES</h3><p>${esc(history)}</p></section>` : ''}
    ${aliases.length ? `<section class="editorial-section"><h3>ALIASES / NOTABLE NAMES</h3>${chips(aliases)}</section>` : ''}
    ${flavors.length ? `<section class="editorial-section"><h3>AROMA & FLAVOR</h3>${chips(flavors)}</section>` : ''}
    ${conflicts.length ? `<section class="editorial-section"><h3>CONFLICTING OR UNVERIFIED CLAIMS</h3>${conflicts.map((item) => `<div class="conflict">${esc(item)}</div>`).join('')}</section>` : ''}
    <section class="editorial-section"><h3>SOURCES</h3>${compactSourceMarkup(profile.sources)}</section>
    <a class="google-search-button" href="${googleResearchUrl(profile.canonical_name || currentStrain?.name || '')}" target="_blank" rel="noopener noreferrer">Search Google again</a>`;
};

renderResearchPreview = function renderResearchPreview(profile) {
  const overview = profile.overview || profile.research_summary || '';
  const history = profile.history || '';
  const aliases = Array.isArray(profile.aliases) ? profile.aliases : [];
  const flavors = Array.isArray(profile.aroma_and_flavor) ? profile.aroma_and_flavor : [];
  $('researchPreview').innerHTML = `<article class="editorial-profile">
    <header class="editorial-head">
      <span class="confidence">${esc(profile.confidence || 'owner supplied')}</span>
      <h2>${esc(profile.canonical_name || pendingName)}</h2>
      <div class="editorial-lineage">${esc(profile.exact_cross || 'Lineage not entered')}</div>
      <div class="editorial-breeder">${esc(profile.breeder_or_creator || 'Breeder not entered')}</div>
    </header>
    ${imagePreviewMarkup(pendingResearchFiles)}
    ${overview ? `<section class="editorial-section"><h3>OVERVIEW</h3><p>${esc(overview)}</p></section>` : ''}
    ${history && history !== overview ? `<section class="editorial-section"><h3>FULL RESEARCH / HISTORY</h3><p>${esc(history)}</p></section>` : ''}
    ${aliases.length ? `<section class="editorial-section"><h3>ALIASES</h3>${chips(aliases)}</section>` : ''}
    ${flavors.length ? `<section class="editorial-section"><h3>AROMA & FLAVOR</h3>${chips(flavors)}</section>` : ''}
    <section class="editorial-section"><h3>SOURCE</h3>${compactSourceMarkup(profile.sources)}</section>
  </article>`;
};

runResearch = function runResearch(name, hints = '', targetId = null) {
  name = String(name || '').trim();
  if (!name) return alert('Enter a strain name.');
  pendingTargetId = targetId;
  pendingName = name;
  pendingProfile = null;
  pendingResearchFiles = [];
  show('researchModal');
  $('applyResearch').disabled = true;
  const existingProfile = targetId ? profileFor(targetId) : null;
  const existingStrain = targetId ? strains.find((item) => item.id === targetId) : null;
  const savedText = existingProfile?.history || existingProfile?.overview || existingProfile?.research_summary || '';
  $('researchPreview').innerHTML = `<div class="research-entry">
    <h2>${esc(name)}</h2>
    <p class="intro">Open Google, copy the useful strain overview, then paste it here. The Nutt Bank will store it as one clean reference entry instead of breaking it into repetitive cards.</p>
    <a class="google-search-button" href="${googleResearchUrl(name)}" target="_blank" rel="noopener noreferrer">Search ${esc(name)} on Google</a>
    <label for="googleResearchPaste">Paste the research</label>
    <textarea id="googleResearchPaste" placeholder="Paste the Google AI overview, breeder description, SeedFinder entry, or other useful strain research here.">${esc(savedText)}</textarea>
    <p class="paste-helper">The full text is preserved. The app only pulls breeder and lineage into the quick-reference header.</p>
    <div class="field-row">
      <div><label for="googleBreeder">Breeder / creator</label><input id="googleBreeder" value="${esc(existingProfile?.breeder_or_creator || existingStrain?.breeder || '')}" placeholder="Example: Sherbinskis / Cookie Fam"></div>
      <div><label for="googleLineage">Lineage</label><input id="googleLineage" value="${esc(existingProfile?.exact_cross || existingStrain?.cross_name || '')}" placeholder="Example: Sunset Sherbet × Thin Mint GSC"></div>
    </div>
    <label for="googleAliases">Aliases / notable phenotypes <span class="optional">optional</span></label>
    <input id="googleAliases" value="${esc((existingProfile?.aliases || []).join(', '))}" placeholder="Larry Bird, Gelato #33, Bacio Gelato">
    <label for="googleFlavors">Aroma & flavor <span class="optional">optional</span></label>
    <input id="googleFlavors" value="${esc((existingProfile?.aroma_and_flavor || existingStrain?.flavors || []).join(', '))}" placeholder="Sweet, creamy, citrus, gas">
    <label for="googleImages">Reference images <span class="optional">optional</span></label>
    <input id="googleImages" type="file" accept="image/*" multiple>
    <div id="selectedImagePreview"></div>
    <button id="buildResearchPreview" class="button primary full large" style="margin-top:18px">Preview entry</button>
  </div>`;

  $('googleImages').onchange = (event) => {
    pendingResearchFiles = [...(event.target.files || [])].slice(0, 8);
    $('selectedImagePreview').innerHTML = imagePreviewMarkup(pendingResearchFiles);
  };

  $('buildResearchPreview').onclick = () => {
    const pasted = cleanResearchText($('googleResearchPaste').value);
    const breeder = $('googleBreeder').value.trim() || extractBreederFromPaste(pasted) || 'Not confirmed';
    const lineage = $('googleLineage').value.trim() || extractLineageFromPaste(pasted) || 'Not confirmed';
    const aliases = $('googleAliases').value.split(',').map((item) => item.trim()).filter(Boolean);
    const flavors = $('googleFlavors').value.split(',').map((item) => item.trim()).filter(Boolean);
    if (!pasted && breeder === 'Not confirmed' && lineage === 'Not confirmed') return alert('Paste research or enter the breeder or lineage.');
    pendingProfile = {
      canonical_name: name,
      aliases,
      breeder_or_creator: breeder,
      source_or_cut: '',
      exact_cross: lineage,
      expanded_lineage: lineage,
      overview: conciseOverview(pasted),
      history: pasted,
      provenance: 'Owner-saved research gathered through Google and linked sources.',
      parent_background: lineage !== 'Not confirmed' ? lineage.split(/\s*[×x]\s*/).filter(Boolean) : [],
      notable_cuts_or_phenotypes: aliases,
      aroma_and_flavor: flavors,
      cultivation_notes: '',
      related_cultivars: [],
      conflicting_claims: [],
      research_summary: conciseOverview(pasted),
      sources: [{ title: `Google results for ${name}`, url: googleResearchUrl(name), publisher: 'google.com', source_type: 'research search' }],
      confidence: 'owner reviewed',
      researched_at: new Date().toISOString()
    };
    renderResearchPreview(pendingProfile);
    $('applyResearch').disabled = false;
  };
};

applyPendingResearch = async function applyPendingResearch() {
  if (!pendingProfile) return;
  $('applyResearch').disabled = true;
  $('applyResearch').textContent = 'Saving…';
  try {
    let strainId = pendingTargetId;
    const row = {
      breeder: pendingProfile.breeder_or_creator || 'Not confirmed',
      cross_name: pendingProfile.exact_cross || 'Not confirmed',
      lineage: pendingProfile.exact_cross || 'Not confirmed',
      flavors: pendingProfile.aroma_and_flavor || [],
      status: `Reference updated · ${dateText(pendingProfile.researched_at)}`
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
    for (const file of pendingResearchFiles) {
      const safeName = file.name.replace(/[^a-z0-9._-]/gi, '-');
      const path = `${ownerId()}/${strainId}/${Date.now()}-${safeName}`;
      const upload = await db.storage.from('strain-images').upload(path, file, { contentType: file.type || 'image/jpeg' });
      if (upload.error) continue;
      await db.from('strain_photos').insert({ owner_id: ownerId(), strain_id: strainId, storage_path: path });
    }
    pendingResearchFiles = [];
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
};
