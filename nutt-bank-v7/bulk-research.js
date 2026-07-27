(function () {
  const STATE_KEY = 'nutt-bank-bulk-research-v1';
  const DELAY_MS = 2500;
  const MAX_RETRIES = 2;
  let running = false;
  let stopRequested = false;
  let wakeLock = null;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const toArray = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
  const unique = (items) => [...new Set(items.filter(Boolean))];
  const safeDate = (value) => {
    try { return value ? new Date(value).toLocaleDateString() : new Date().toLocaleDateString(); }
    catch { return new Date().toLocaleDateString(); }
  };

  function panelMarkup() {
    return `<section id="bulkResearchPanel" class="panel">
      <p class="eyebrow">LIBRARY RESEARCH</p>
      <h2 style="margin:4px 0 8px;font-size:22px">Research the whole library</h2>
      <p style="margin:0 0 12px">Runs the current cannabis research search for each strain in the selected library and saves every completed profile as it finishes.</p>
      <div id="bulkResearchProgress" class="hidden" style="margin:12px 0">
        <div style="height:8px;background:#e4e9e5;border-radius:2px;overflow:hidden"><div id="bulkResearchBar" style="height:100%;width:0;background:#1d5a35;transition:width .2s"></div></div>
        <p id="bulkResearchStatus" class="sync" style="margin:8px 0 0">Ready</p>
      </div>
      <div style="display:grid;gap:8px">
        <button id="bulkRefreshAll" class="button primary full">Refresh every strain profile</button>
        <button id="bulkResearchMissing" class="button secondary full">Research missing profiles only</button>
        <button id="bulkStop" class="button danger full hidden">Stop after current strain</button>
      </div>
      <p class="helper" style="margin-top:10px">Keep this tab open while it runs. Progress is saved after every strain and can resume later.</p>
    </section>`;
  }

  function installPanel() {
    if (document.getElementById('bulkResearchPanel')) return;
    const morePage = document.getElementById('morePage');
    if (!morePage) return;
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) adminPanel.insertAdjacentHTML('afterend', panelMarkup());
    else morePage.insertAdjacentHTML('beforeend', panelMarkup());

    document.getElementById('bulkRefreshAll').onclick = () => beginBulk('all');
    document.getElementById('bulkResearchMissing').onclick = () => beginBulk('missing');
    document.getElementById('bulkStop').onclick = () => {
      stopRequested = true;
      setStatus('Stopping after the current strain…');
    };
    renderSavedState();
  }

  function readState() {
    try { return JSON.parse(localStorage.getItem(STATE_KEY) || 'null'); }
    catch { return null; }
  }

  function writeState(state) {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }

  function clearState() {
    localStorage.removeItem(STATE_KEY);
  }

  function setStatus(text) {
    const el = document.getElementById('bulkResearchStatus');
    if (el) el.textContent = text;
  }

  function setProgress(done, total) {
    const wrap = document.getElementById('bulkResearchProgress');
    const bar = document.getElementById('bulkResearchBar');
    if (wrap) wrap.classList.remove('hidden');
    if (bar) bar.style.width = `${total ? Math.round((done / total) * 100) : 0}%`;
  }

  function setRunningUI(value) {
    running = value;
    ['bulkRefreshAll', 'bulkResearchMissing'].forEach((id) => {
      const button = document.getElementById(id);
      if (button) button.disabled = value;
    });
    const stop = document.getElementById('bulkStop');
    if (stop) stop.classList.toggle('hidden', !value);
  }

  function renderSavedState() {
    const state = readState();
    if (!state || state.complete) return;
    const currentOwner = typeof ownerId === 'function' ? ownerId() : null;
    if (currentOwner && state.ownerId !== currentOwner) return;
    setProgress(state.completedIds?.length || 0, state.total || 0);
    const completed = state.completedIds?.length || 0;
    setStatus(`Paused at ${completed} of ${state.total || 0}. Tap the same option to resume.`);
  }

  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
    } catch (_) {}
  }

  async function releaseWakeLock() {
    try { await wakeLock?.release(); } catch (_) {}
    wakeLock = null;
  }

  function profileRow(profile, strain) {
    const aromas = unique([
      ...toArray(profile.aroma_and_flavor),
      ...toArray(profile.aroma),
      ...toArray(profile.flavor)
    ]);
    const expanded = Array.isArray(profile.expanded_lineage)
      ? profile.expanded_lineage.join(' → ')
      : profile.expanded_lineage;
    return {
      breeder: profile.breeder_or_creator || strain.breeder || 'Unverified',
      cross_name: profile.exact_cross || strain.cross_name || 'Not publicly verified',
      lineage: expanded || profile.exact_cross || strain.lineage || 'Not publicly verified',
      flavors: aromas,
      status: `Sourced research · ${profile.confidence || 'unknown'} · ${safeDate(profile.researched_at)}`
    };
  }

  async function saveProfile(strain, profile) {
    const libraryOwner = ownerId();
    const update = await db.from('strains')
      .update(profileRow(profile, strain))
      .eq('id', strain.id)
      .eq('owner_id', libraryOwner);
    if (update.error) throw update.error;

    const old = await db.from('strain_notes')
      .select('id')
      .eq('owner_id', libraryOwner)
      .eq('strain_id', strain.id)
      .like('note_text', 'NUTT_RESEARCH_V2%');
    if (old.error) throw old.error;
    for (const note of old.data || []) {
      const removed = await db.from('strain_notes').delete().eq('id', note.id).eq('owner_id', libraryOwner);
      if (removed.error) throw removed.error;
    }

    const inserted = await db.from('strain_notes').insert({
      owner_id: libraryOwner,
      strain_id: strain.id,
      note_text: `NUTT_RESEARCH_V2\n${JSON.stringify(profile)}`
    });
    if (inserted.error) throw inserted.error;
  }

  async function researchStrain(strain) {
    const existingProfile = typeof profileFor === 'function' ? profileFor(strain.id) : null;
    const response = await fetch('/api/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        name: strain.name,
        requested_name: strain.name,
        hints: [strain.breeder, strain.cross_name, strain.lineage, strain.general_notes].filter(Boolean).join(' | '),
        existing: {
          breeder: strain.breeder,
          cross: strain.cross_name,
          lineage: strain.lineage,
          owner_notes: strain.general_notes,
          saved_research: existingProfile
        }
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.profile) {
      const error = new Error(data.error || `Research failed with status ${response.status}.`);
      error.status = response.status;
      throw error;
    }
    await saveProfile(strain, data.profile);
    return data.profile;
  }

  async function processWithRetry(strain) {
    let lastError = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      try { return await researchStrain(strain); }
      catch (error) {
        lastError = error;
        const rateLimited = error.status === 429 || /quota|rate limit|too many/i.test(error.message || '');
        if (attempt >= MAX_RETRIES) break;
        await sleep(rateLimited ? 30000 * (attempt + 1) : 5000 * (attempt + 1));
      }
    }
    throw lastError;
  }

  async function beginBulk(mode) {
    if (running) return;
    if (!session?.access_token) return alert('Sign in again before starting library research.');
    if (!Array.isArray(strains) || !strains.length) return alert('No strains are loaded in the selected library.');

    const libraryOwner = ownerId();
    const saved = readState();
    const canResume = saved && !saved.complete && saved.ownerId === libraryOwner && saved.mode === mode;
    const completedIds = new Set(canResume ? saved.completedIds || [] : []);
    const failed = canResume ? saved.failed || [] : [];
    const candidates = (mode === 'missing' ? strains.filter((strain) => !profileFor(strain.id)) : [...strains])
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
    const queue = candidates.filter((strain) => !completedIds.has(strain.id));

    if (!canResume) {
      const wording = mode === 'all'
        ? `Refresh research for all ${candidates.length} strains in the selected library? Existing research profiles will be replaced, but owner notes, counts, tags, and photos will remain.`
        : `Research the ${candidates.length} strains that do not have a saved profile yet?`;
      if (!confirm(wording)) return;
    }

    if (!queue.length) {
      clearState();
      setProgress(candidates.length, candidates.length);
      setStatus('Every selected strain already has a completed profile.');
      return;
    }

    stopRequested = false;
    setRunningUI(true);
    await requestWakeLock();
    const total = candidates.length;
    const state = {
      ownerId: libraryOwner,
      mode,
      total,
      completedIds: [...completedIds],
      failed,
      complete: false,
      updatedAt: new Date().toISOString()
    };
    writeState(state);

    try {
      for (let index = 0; index < queue.length; index += 1) {
        if (stopRequested) break;
        const strain = queue[index];
        const doneBefore = completedIds.size;
        setProgress(doneBefore, total);
        setStatus(`Researching ${strain.name} · ${doneBefore + 1} of ${total}`);
        try {
          await processWithRetry(strain);
          completedIds.add(strain.id);
          state.completedIds = [...completedIds];
          state.updatedAt = new Date().toISOString();
          writeState(state);
          setProgress(completedIds.size, total);
          setStatus(`Saved ${strain.name} · ${completedIds.size} of ${total}`);
        } catch (error) {
          state.failed.push({ id: strain.id, name: strain.name, error: error.message || String(error) });
          state.updatedAt = new Date().toISOString();
          writeState(state);
          setStatus(`Could not research ${strain.name}; continuing to the next strain.`);
        }
        if (!stopRequested) await sleep(DELAY_MS);
      }

      if (stopRequested) {
        setStatus(`Paused after ${completedIds.size} of ${total}. Tap the same option to resume.`);
      } else {
        state.complete = true;
        state.updatedAt = new Date().toISOString();
        writeState(state);
        const failures = state.failed.length;
        setProgress(completedIds.size, total);
        setStatus(failures
          ? `Finished ${completedIds.size} profiles. ${failures} strains could not be completed and can be retried.`
          : `Finished all ${completedIds.size} strain profiles.`);
        clearState();
      }
      await loadLibrary();
    } finally {
      setRunningUI(false);
      await releaseWakeLock();
    }
  }

  window.addEventListener('DOMContentLoaded', installPanel, { once: true });
  if (document.readyState !== 'loading') installPanel();
  window.addEventListener('storage', renderSavedState);
})();
