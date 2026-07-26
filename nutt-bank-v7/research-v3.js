(function () {
  const asArray = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
  const clean = (value) => String(value || '').trim();
  const hasText = (value) => clean(value) && !/^(not confirmed|not consistently reported|unknown)$/i.test(clean(value));

  function refChips(items) {
    const values = asArray(items);
    return values.length ? `<div class="ref-chips">${values.map((item) => `<span>${esc(item)}</span>`).join('')}</div>` : '';
  }

  function refBullets(items) {
    const values = asArray(items);
    return values.length ? `<ul class="ref-list">${values.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>` : '';
  }

  function refSection(title, body, className = '') {
    if (!body) return '';
    return `<section class="ref-section ${className}"><h3>${esc(title)}</h3>${body}</section>`;
  }

  function refParagraph(value) {
    return hasText(value) ? `<p>${esc(value)}</p>` : '';
  }

  function imageGallery(profile) {
    const images = asArray(profile.images).filter((image) => image?.image_url);
    if (!images.length) return '';
    return `<div class="ref-images" aria-label="Reference images">${images.map((image, index) => `<a href="${esc(image.source_url || image.image_url)}" target="_blank" rel="noopener noreferrer" class="ref-image ${index === 0 ? 'primary-image' : ''}"><img src="${esc(image.image_url)}" alt="${esc(profile.canonical_name || pendingName)} reference image" loading="lazy"><span>${esc(image.publisher || 'Source')}</span></a>`).join('')}</div>`;
  }

  function keyFacts(profile, options = {}) {
    const facts = [
      ['Breeder / creator', profile.breeder_or_creator, 'identity'],
      ['Cross', profile.exact_cross, 'identity'],
      ['Type', profile.type, 'detail'],
      ['Potency', profile.potency, 'detail']
    ].filter(([, value, group]) => hasText(value) && !(options.detail && group === 'identity'));
    if (!facts.length) return '';
    return `<div class="ref-facts">${facts.map(([label, value]) => `<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}</div>`;
  }

  function aromaFlavorAppearance(profile) {
    const rows = [];
    if (asArray(profile.aroma).length) rows.push(`<div><strong>Aroma</strong>${refChips(profile.aroma)}</div>`);
    if (asArray(profile.flavor).length) rows.push(`<div><strong>Flavor</strong>${refChips(profile.flavor)}</div>`);
    if (!rows.length && asArray(profile.aroma_and_flavor).length) rows.push(`<div><strong>Aroma and flavor</strong>${refChips(profile.aroma_and_flavor)}</div>`);
    if (hasText(profile.appearance)) rows.push(`<div><strong>Appearance</strong><p>${esc(profile.appearance)}</p></div>`);
    return rows.length ? `<div class="ref-subsections">${rows.join('')}</div>` : '';
  }

  function effectsUses(profile) {
    const effects = asArray(profile.commonly_reported_effects);
    const uses = asArray(profile.commonly_reported_uses);
    if (!effects.length && !uses.length) return '';
    return `<div class="ref-two-column">
      ${effects.length ? `<div><strong>Commonly reported effects</strong>${refBullets(effects)}</div>` : ''}
      ${uses.length ? `<div><strong>Commonly reported uses</strong>${refBullets(uses)}</div>` : ''}
    </div><p class="ref-disclaimer">${esc(profile.use_disclaimer || 'Effects and uses are consumer reports from public sources, not medical advice.')}</p>`;
  }

  function cultivation(profile) {
    const c = profile.cultivation && typeof profile.cultivation === 'object' ? profile.cultivation : {};
    const facts = [
      ['Flowering time', c.flowering_time],
      ['Yield', c.yield],
      ['Difficulty', c.difficulty],
      ['Growth structure', c.growth_structure],
      ['Environment', c.environment]
    ].filter(([, value]) => hasText(value));
    const notes = asArray(c.notes).length ? c.notes : (hasText(profile.cultivation_notes) ? [profile.cultivation_notes] : []);
    if (!facts.length && !notes.length) return '';
    return `${facts.length ? `<dl class="ref-definition-list">${facts.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>` : ''}${refBullets(notes)}`;
  }

  function community(profile) {
    const community = profile.community_sentiment && typeof profile.community_sentiment === 'object' ? profile.community_sentiment : {};
    const blocks = [];
    if (hasText(community.summary)) blocks.push(`<p>${esc(community.summary)}</p>`);
    if (asArray(community.positive_themes).length) blocks.push(`<div><strong>Positive themes</strong>${refBullets(community.positive_themes)}</div>`);
    if (asArray(community.cautions).length) blocks.push(`<div><strong>Cautions and mixed feedback</strong>${refBullets(community.cautions)}</div>`);
    if (asArray(community.platform_notes).length) blocks.push(`<div><strong>Platform notes</strong>${refBullets(community.platform_notes)}</div>`);
    return blocks.join('');
  }

  function sourceLinks(sources) {
    const values = asArray(sources);
    if (!values.length) return '';
    return `<div class="ref-sources">${values.map((source) => `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(source.title || source.publisher || 'Source')}</strong><span>${esc(source.publisher || '')}</span></a>`).join('')}</div>`;
  }

  function referenceProfile(profile, options = {}) {
    if (!profile) return `<section class="ref-empty"><h3>No research saved yet</h3><p>Tap Research to build a sourced strain profile.</p><button id="emptyResearch" class="button primary full">Research this strain</button></section>`;
    const title = profile.canonical_name || pendingName || currentStrain?.name || 'Strain profile';
    const aliases = asArray(profile.aliases);
    const parentBackground = asArray(profile.parent_background);
    const phenotypes = asArray(profile.notable_cuts_or_phenotypes);
    const related = asArray(profile.related_cultivars);
    const conflicts = asArray(profile.conflicting_claims);
    const confidence = clean(profile.confidence || 'medium').toLowerCase();

    return `<article class="reference-profile ${options.preview ? 'reference-preview' : ''}">
      <header class="ref-hero">
        ${imageGallery(profile)}
        <div class="ref-hero-copy">
          <div class="ref-kicker"><span class="ref-confidence ${esc(confidence)}">${esc(confidence)} confidence</span>${aliases.length ? `<span>Also known as ${esc(aliases.join(', '))}</span>` : ''}</div>
          ${options.preview ? `<h2>${esc(title)}</h2>` : ''}
          ${refParagraph(profile.overview || profile.research_summary)}
        </div>
      </header>
      ${keyFacts(profile, options)}
      ${refSection('Lineage and genetics', `${hasText(profile.expanded_lineage) && clean(profile.expanded_lineage) !== clean(profile.exact_cross) ? refParagraph(profile.expanded_lineage) : ''}${parentBackground.length ? `<div><strong>Parent background</strong>${refBullets(parentBackground)}</div>` : ''}`)}
      ${refSection('Aroma, flavor, and appearance', aromaFlavorAppearance(profile))}
      ${refSection('Effects and commonly reported uses', effectsUses(profile))}
      ${refSection('Cultivation notes', cultivation(profile))}
      ${refSection('History and provenance', `${refParagraph(profile.history)}${hasText(profile.provenance) ? `<p class="ref-meta-copy">${esc(profile.provenance)}</p>` : ''}`)}
      ${phenotypes.length ? refSection('Notable cuts and phenotypes', refBullets(phenotypes)) : ''}
      ${related.length ? refSection('Related cultivars', refChips(related)) : ''}
      ${community(profile) ? refSection('Community sentiment', community(profile)) : ''}
      ${conflicts.length ? refSection('Conflicting or unverified claims', refBullets(conflicts), 'ref-conflicts') : ''}
      ${asArray(profile.sources).length ? refSection('Sources', sourceLinks(profile.sources)) : ''}
      <footer class="ref-footer">Researched ${esc(dateText(profile.researched_at) || 'recently')}</footer>
    </article>`;
  }

  researchMarkup = function (profile) {
    return referenceProfile(profile, { preview: false, detail: true });
  };

  renderResearchPreview = function (profile) {
    $('researchPreview').innerHTML = referenceProfile(profile, { preview: true });
  };

  runResearch = async function (name, hints = '', targetId = null) {
    name = clean(name);
    if (!name) return alert('Enter a strain name.');
    pendingTargetId = targetId;
    pendingName = name;
    pendingProfile = null;
    show('researchModal');
    $('applyResearch').disabled = true;
    $('researchPreview').innerHTML = `<div class="ref-loading"><div class="spinner"></div><h2>Researching ${esc(name)}</h2><p>Checking genetics references, breeder and producer pages, cannabis publications, and community discussions.</p></div>`;
    const existingStrain = targetId ? strains.find((item) => item.id === targetId) : null;
    const existingProfile = targetId ? profileFor(targetId) : null;
    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          name,
          requested_name: name,
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
      if (!response.ok) throw new Error(data.error || 'Research could not run.');
      pendingProfile = data.profile;
      renderResearchPreview(pendingProfile);
      $('applyResearch').disabled = false;
    } catch (error) {
      $('researchPreview').innerHTML = `<section class="ref-empty"><h2>No profile found yet</h2><p>${esc(error.message || 'Research could not run.')}</p><p>Add a breeder, source, parent, or phenotype hint and try again.</p><button id="retryResearch" class="button primary full">Try again</button></section>`;
      $('retryResearch').onclick = () => runResearch(name, hints, targetId);
    }
  };
})();
