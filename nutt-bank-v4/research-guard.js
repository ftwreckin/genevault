const CANNABIS_ONLY_INSTRUCTION = `
Cannabis-only cultivar research. The entered name is a cannabis strain/cultivar name, even when it is also a normal phrase.
Search for cannabis genetics, lineage, breeder or creator, provenance, phenotype/cut history, seed releases, aroma, cultivation notes, and related cultivars.
Prioritize official breeder or creator pages, SeedFinder, Leafly, AllBud, Wikileaf, reputable seed banks, breeder interviews, archived breeder posts, and established cannabis forums.
Ignore and exclude unrelated meanings, including NASA, astronauts, space, movies, actors, dictionaries, astronomy, general encyclopedias, unrelated products, and unrelated people.
Do not invent certainty. Keep useful cannabis information when confidence is low, but label disputed or weak claims clearly.
`.trim();

const CANNABIS_TERMS = /\b(cannabis|marijuana|weed|strain|cultivar|genetic|genetics|breeder|breeding|seedfinder|leafly|seedbank|seed bank|seed|seeds|clone|cut|phenotype|pheno|lineage|cross|crossed|hybrid|indica|sativa|terpene|terpenes|thc|cbd|flower|bud|cultivation|grower|hash|kush|haze|diesel|cookies|gelato|runtz|sherb|zkittlez|chem|gmo|og)\b/i;
const CLEARLY_UNRELATED_TERMS = /\b(nasa|astronaut candidate|space station|spacewalk|orbital dynamics|johnson space center|imdb|rotten tomatoes|directed by|starring|actor|actress|film|movie|britannica|merriam-webster|dictionary definition|astronomy|meteorology|oceanography|geology)\b/i;
const TRUSTED_CANNABIS_DOMAINS = [
  'seedfinder.eu','leafly.com','allbud.com','wikileaf.com','growdiaries.com','rollitup.org','icmag.com',
  'thcfarmer.com','seedbank.com','seedsman.com','attitudeseedbank.co.uk','northatlanticseed.com',
  'multiversebeans.com','neptuneseedbank.com','deeplyrootedseedbank.com','greatlakesgenetics.com',
  'jbcseeds.com','speakeasyseedbank.com','heritageseedbank.com','strainly.io','cannabis-seeds-bank.co.uk'
];
const BLOCKED_NON_CANNABIS_DOMAINS = [
  'nasa.gov','imdb.com','rottentomatoes.com','britannica.com','merriam-webster.com','astronomy.com','space.com'
];

function sourceHost(source) {
  try { return new URL(source?.url || '').hostname.toLowerCase().replace(/^www\./, ''); }
  catch { return ''; }
}

function isCannabisSource(source, strainName) {
  const host = sourceHost(source);
  if (BLOCKED_NON_CANNABIS_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`))) return false;
  if (TRUSTED_CANNABIS_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`))) return true;
  const haystack = [source?.title, source?.publisher, source?.source_type, source?.snippet, source?.url].filter(Boolean).join(' ');
  const nameTokens = String(strainName || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((token) => token.length > 3);
  const hasNameToken = nameTokens.some((token) => haystack.toLowerCase().includes(token));
  const cannabisPath = /\/(strain|strains|cultivar|cultivars|seed|seeds|genetic|genetics|breeder|breeders|product|products)\b/i.test(source?.url || '');
  return CANNABIS_TERMS.test(haystack) || (hasNameToken && cannabisPath);
}

function cleanCannabisNarrative(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const chunks = raw.split(/\n\s*\n|(?<=[.!?])\s+(?=[A-Z])/).map((part) => part.trim()).filter(Boolean);
  const kept = chunks.filter((part) => {
    if (CLEARLY_UNRELATED_TERMS.test(part) && !CANNABIS_TERMS.test(part)) return false;
    return CANNABIS_TERMS.test(part) || !CLEARLY_UNRELATED_TERMS.test(part);
  });
  const cleaned = kept.join(' ').trim();
  if (CLEARLY_UNRELATED_TERMS.test(cleaned) && !CANNABIS_TERMS.test(cleaned)) return '';
  return cleaned;
}

function cleanCannabisList(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => cleanCannabisNarrative(item)).filter(Boolean);
}

function cannabisProfileScore(profile, strainName) {
  if (!profile || typeof profile !== 'object') return -100;
  const acceptedSources = (profile.sources || []).filter((source) => isCannabisSource(source, strainName));
  const body = [
    profile.breeder_or_creator, profile.source_or_cut, profile.exact_cross, profile.expanded_lineage,
    profile.history, profile.provenance, profile.research_summary,
    ...(profile.aliases || []), ...(profile.parent_background || []),
    ...(profile.notable_cuts_or_phenotypes || []), ...(profile.aroma_and_flavor || []),
    ...(profile.cultivation_notes ? [profile.cultivation_notes] : []), ...(profile.related_cultivars || [])
  ].filter(Boolean).join(' ');
  let score = acceptedSources.length * 4;
  if (CANNABIS_TERMS.test(body)) score += 4;
  if (/[×x]/i.test(profile.exact_cross || '') || /\b(s1|bx\d*|f\d+)\b/i.test(profile.exact_cross || '')) score += 2;
  if (profile.breeder_or_creator && !/unknown|not found|unverified/i.test(profile.breeder_or_creator)) score += 1;
  if (CLEARLY_UNRELATED_TERMS.test(body) && !CANNABIS_TERMS.test(body)) score -= 20;
  return score;
}

function sanitizeCannabisProfile(profile, strainName) {
  const originalSources = Array.isArray(profile?.sources) ? profile.sources : [];
  const sources = originalSources.filter((source) => isCannabisSource(source, strainName));
  const cleaned = {
    ...profile,
    canonical_name: strainName,
    breeder_or_creator: CLEARLY_UNRELATED_TERMS.test(profile?.breeder_or_creator || '') ? '' : (profile?.breeder_or_creator || ''),
    source_or_cut: cleanCannabisNarrative(profile?.source_or_cut),
    history: cleanCannabisNarrative(profile?.history),
    provenance: cleanCannabisNarrative(profile?.provenance),
    research_summary: cleanCannabisNarrative(profile?.research_summary),
    parent_background: cleanCannabisList(profile?.parent_background),
    notable_cuts_or_phenotypes: cleanCannabisList(profile?.notable_cuts_or_phenotypes),
    cultivation_notes: cleanCannabisNarrative(profile?.cultivation_notes),
    related_cultivars: cleanCannabisList(profile?.related_cultivars),
    conflicting_claims: cleanCannabisList(profile?.conflicting_claims),
    sources,
    researched_at: profile?.researched_at || new Date().toISOString()
  };
  if (!sources.length && cleaned.confidence === 'high') cleaned.confidence = 'low';
  cleaned.research_notice = sources.length
    ? `Cannabis-only filter accepted ${sources.length} source${sources.length === 1 ? '' : 's'} and removed ${Math.max(0, originalSources.length - sources.length)} unrelated result${Math.max(0, originalSources.length - sources.length) === 1 ? '' : 's'}.`
    : 'No clearly cannabis-specific source links survived the filter. Review carefully before saving.';
  return cleaned;
}

function renderResearchPreview(profile) {
  $('researchPreview').innerHTML = `<section class="preview-hero"><span class="confidence">${esc(profile.confidence || 'unknown')} confidence</span><h2>${esc(profile.canonical_name || pendingName)}</h2><p>${esc(profile.research_summary || 'Cannabis-specific information was limited. Review the sourced fields below.')}</p></section>
    ${profile.research_notice ? `<section class="panel"><h3 class="panel-title">CANNABIS SEARCH FILTER</h3><p>${esc(profile.research_notice)}</p></section>` : ''}
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

async function requestCannabisResearch(queryName, originalName, hints, existingStrain, existingProfile) {
  const response = await fetch('/api/research', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({
      name: queryName,
      requested_name: originalName,
      category: 'cannabis cultivar genetics',
      hints: [CANNABIS_ONLY_INSTRUCTION, hints].filter(Boolean).join('\n\n'),
      preferred_sources: ['official breeder or creator', 'SeedFinder', 'Leafly', 'AllBud', 'Wikileaf', 'reputable seed banks', 'breeder interviews', 'cannabis forums'],
      exclude_topics: ['NASA', 'astronauts', 'space', 'movies', 'actors', 'dictionaries', 'general encyclopedias', 'unrelated products or people'],
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
  if (!response.ok) throw new Error(data.error || 'Research failed.');
  return data.profile;
}

async function runResearch(name, hints = '', targetId = null) {
  name = String(name || '').trim();
  if (!name) return alert('Enter a strain name.');
  pendingTargetId = targetId;
  pendingName = name;
  pendingProfile = null;
  show('researchModal');
  $('applyResearch').disabled = true;
  $('researchPreview').innerHTML = '<div class="loading"><div><div class="spinner"></div><h2>Researching the cannabis strain</h2><p>Checking breeder pages, genetics databases, SeedFinder, Leafly, seed banks, interviews, and cannabis sources only…</p></div></div>';
  const existingStrain = targetId ? strains.find((item) => item.id === targetId) : null;
  const existingProfile = targetId ? profileFor(targetId) : null;
  const baseName = name.replace(/\s+#?\d+\s*$/, '').trim() || name;
  const queries = [
    `"${name}" cannabis strain genetics breeder lineage`,
    `"${name}" marijuana cultivar phenotype seedfinder leafly`,
    `"${baseName}" cannabis strain breeder seed bank genetics`
  ];

  try {
    let best = null;
    let bestScore = -100;
    let lastError = null;
    for (const query of queries) {
      try {
        const rawProfile = await requestCannabisResearch(query, name, hints, existingStrain, existingProfile);
        const cleaned = sanitizeCannabisProfile(rawProfile, name);
        const score = cannabisProfileScore(cleaned, name);
        if (score > bestScore) { best = cleaned; bestScore = score; }
        if (score >= 5 && cleaned.sources.length) break;
      } catch (error) {
        lastError = error;
      }
    }
    if (!best || bestScore < 2) {
      throw new Error(lastError?.message || `No cannabis-specific information could be verified for ${name}. Unrelated web results were blocked and nothing was saved.`);
    }
    pendingProfile = best;
    if (bestScore < 5) {
      pendingProfile.confidence = 'low';
      pendingProfile.research_notice += ' Available cannabis information is limited or weakly sourced, so the profile is marked low confidence.';
    }
    renderResearchPreview(pendingProfile);
    $('applyResearch').disabled = false;
  } catch (error) {
    $('researchPreview').innerHTML = `<section class="panel"><h2>No usable cannabis profile found</h2><p>${esc(error.message)}</p><p class="meta" style="margin-top:8px">The app will not save NASA, movie, dictionary, or other unrelated results.</p><button id="retryResearch" class="button primary full" style="margin-top:10px">Try cannabis search again</button></section>`;
    $('retryResearch').onclick = () => runResearch(name, hints, targetId);
  }
}
