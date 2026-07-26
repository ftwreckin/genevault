renderResearchPreview = function(profile) {
  $('researchPreview').innerHTML = `<section class="preview-hero"><span class="confidence">${esc(profile.confidence || 'unknown')} confidence</span><h2>${esc(profile.canonical_name || pendingName)}</h2><p>${esc(profile.research_summary || 'Review the sourced strain information below.')}</p></section>
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
};

runResearch = async function(name, hints = '', targetId = null) {
  name = String(name || '').trim();
  if (!name) return alert('Enter a strain name.');

  pendingTargetId = targetId;
  pendingName = name;
  pendingProfile = null;
  show('researchModal');
  $('applyResearch').disabled = true;
  $('researchPreview').innerHTML = '<div class="loading"><div><div class="spinner"></div><h2>Searching strain sources</h2><p>Checking breeder, genetics, seed, clone, and cannabis reference pages…</p></div></div>';

  const existingStrain = targetId ? strains.find((item) => item.id === targetId) : null;
  const existingProfile = targetId ? profileFor(targetId) : null;

  try {
    const rawProfile = await requestCannabisResearch(name, name, hints, existingStrain, existingProfile);
    const cleaned = sanitizeCannabisProfile(rawProfile, name);
    const score = cannabisProfileScore(cleaned, name);
    if (!cleaned.sources?.length || score < 1) throw new Error('No profile found yet.');
    if (score < 5) cleaned.confidence = 'low';
    delete cleaned.research_notice;
    pendingProfile = cleaned;
    renderResearchPreview(pendingProfile);
    $('applyResearch').disabled = false;
  } catch (error) {
    $('researchPreview').innerHTML = `<section class="panel"><h2>No profile found yet</h2><p>We could not find enough strain information for ${esc(name)}. Add a breeder or source hint and try again.</p><button id="retryResearch" class="button primary full" style="margin-top:10px">Try again</button></section>`;
    $('retryResearch').onclick = () => runResearch(name, hints, targetId);
  }
};
