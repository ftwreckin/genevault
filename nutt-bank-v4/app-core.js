const SUPABASE_URL = 'https://mnwsijiqizyxzjinlhel.supabase.co';
const SUPABASE_KEY = 'sb_publishable_p9UUscQvUXs7lNj5qrmr2A_pTNOrBwz';
const SITE_URL = window.location.origin;
const SUPPORT_ADMIN_EMAIL = 'ftsunbro@gmail.com';
const RESEARCH_PREFIX = 'NUTT_RESEARCH_V2\n';
const TRACKING_TAGS = ['Mother', 'Clone', 'Male', 'Keeper', 'Seed', 'In Flower', 'Veg', 'Archived'];

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
const dateText = (value) => value ? new Date(value).toLocaleDateString() : '';

let session = null;
let strains = [];
let projects = [];
let seeds = [];
let researchByStrain = new Map();
let currentStrain = null;
let pendingProfile = null;
let pendingTargetId = null;
let pendingName = '';
let activePage = 'library';
let channel = null;
let activeOwnerId = null;
let libraryProfiles = [];
let isSupportAdmin = false;
let profileTableAvailable = true;
let enteringApp = false;
let recoveryMode = false;

function show(id) { $(id).classList.remove('hidden'); }
function hide(id) { $(id).classList.add('hidden'); }
function status(text) { $('syncStatus').textContent = text; }
function hasResearch(id) { return researchByStrain.has(id); }
function profileFor(id) { return researchByStrain.get(id) || null; }
function ownerId() { return activeOwnerId || session?.user?.id; }
function lower(value) { return String(value || '').trim().toLowerCase(); }
function setAppMessage(text = '') { $('appMessage').textContent = text; $('appMessage').classList.toggle('hidden', !text); }
function setAuthMessage(text = '', type = '') { const el = $('authMessage'); el.textContent = text; el.className = `message ${type}`.trim(); }
function setAuthBusy(busy) { ['signin','signup','forgotPassword'].forEach((id) => { $(id).disabled = busy; }); }
function friendlyAuthError(error) {
  const raw = String(error?.message || error || 'Unable to continue.');
  if (/redirect/i.test(raw)) return 'The confirmation return address is not allowed yet. The app administrator needs to update the Supabase redirect setting.';
  if (/invalid login credentials/i.test(raw)) return 'Email or password is incorrect. Use Forgot password if needed.';
  if (/email not confirmed/i.test(raw)) return 'Confirm the email from the Supabase message, then sign in again.';
  if (/user already registered/i.test(raw)) return 'That email already has an account. Sign in or use Forgot password.';
  return raw;
}

function parseResearch(note) {
  if (!note?.note_text?.startsWith(RESEARCH_PREFIX)) return null;
  try { return JSON.parse(note.note_text.slice(RESEARCH_PREFIX.length)); }
  catch { return null; }
}

function profileText(profile) {
  if (!profile) return '';
  return JSON.stringify(profile).toLowerCase();
}

async function ensureLibraryProfile() {
  if (!session?.user) return;
  const email = lower(session.user.email);
  const displayName = session.user.user_metadata?.display_name || session.user.user_metadata?.full_name || email.split('@')[0];
  const result = await db.from('library_profiles').upsert({ user_id: session.user.id, email, display_name: displayName }, { onConflict: 'user_id' });
  if (result.error && result.error.code !== '42P01' && !/library_profiles/i.test(result.error.message || '')) throw result.error;
}

function renderLibrarySelector() {
  const select = $('librarySelect');
  const profiles = libraryProfiles.length ? libraryProfiles : [{ user_id: session.user.id, email: session.user.email, display_name: 'My library' }];
  select.innerHTML = profiles.map((profile) => {
    const name = profile.display_name || profile.email || 'Library';
    const own = profile.user_id === session.user.id ? ' (mine)' : '';
    return `<option value="${esc(profile.user_id)}">${esc(name + own)}</option>`;
  }).join('');
  select.value = ownerId();
  $('adminLibraryBar').classList.toggle('hidden', !isSupportAdmin || !profileTableAvailable);
  $('adminPanel').classList.toggle('hidden', !isSupportAdmin);
  updateLibraryContext();
}

function updateLibraryContext() {
  const current = libraryProfiles.find((profile) => profile.user_id === ownerId());
  const label = current?.display_name || current?.email || (ownerId() === session?.user?.id ? 'Your library' : 'Selected library');
  $('activeLibraryText').textContent = `Viewing: ${label}`;
  if (isSupportAdmin) $('syncStatus').textContent = `Admin · ${label}`;
}

async function loadLibraryProfiles() {
  activeOwnerId = session.user.id;
  isSupportAdmin = lower(session.user.email) === SUPPORT_ADMIN_EMAIL;
  profileTableAvailable = true;
  const result = await db.from('library_profiles').select('user_id,email,display_name,created_at').order('created_at');
  if (result.error) {
    if (result.error.code === '42P01' || /library_profiles/i.test(result.error.message || '')) {
      profileTableAvailable = false;
      libraryProfiles = [{ user_id: session.user.id, email: session.user.email, display_name: 'My library' }];
      if (isSupportAdmin) setAppMessage('Admin library access needs the one-time Supabase admin migration. Your own account still works.');
      renderLibrarySelector();
      return;
    }
    throw result.error;
  }
  libraryProfiles = result.data || [];
  if (!libraryProfiles.some((profile) => profile.user_id === session.user.id)) {
    libraryProfiles.push({ user_id: session.user.id, email: session.user.email, display_name: 'My library' });
  }
  if (isSupportAdmin) {
    const dana = libraryProfiles.find((profile) => profile.user_id !== session.user.id && /dana/i.test(`${profile.display_name || ''} ${profile.email || ''}`));
    const other = libraryProfiles.find((profile) => profile.user_id !== session.user.id);
    activeOwnerId = (dana || other)?.user_id || session.user.id;
    setAppMessage('');
  }
  renderLibrarySelector();
}

async function loadLibrary() {
  if (!session) return;
  status('Syncing…');
  const libraryOwner = ownerId();
  const [strainResult, projectResult, seedResult, researchResult] = await Promise.all([
    db.from('strains').select('*').eq('owner_id', libraryOwner).order('name'),
    db.from('breeding_projects').select('*').eq('owner_id', libraryOwner).order('created_at', { ascending: false }),
    db.from('seed_inventory').select('*').eq('owner_id', libraryOwner).order('name'),
    db.from('strain_notes').select('*').eq('owner_id', libraryOwner).like('note_text', 'NUTT_RESEARCH_V2%').order('created_at', { ascending: false })
  ]);

  if (strainResult.error) throw strainResult.error;
  strains = strainResult.data;
  projects = projectResult.data || [];
  seeds = seedResult.data || [];
  researchByStrain = new Map();
  for (const note of researchResult.data || []) {
    if (researchByStrain.has(note.strain_id)) continue;
    const parsed = parseResearch(note);
    if (parsed) researchByStrain.set(note.strain_id, { ...parsed, _noteId: note.id });
  }

  renderAll();
  status('Synced');
}

function renderAll() {
  renderLibrary();
  renderProjects();
  renderSeeds();
  $('accountEmail').textContent = session?.user?.email || '';
  updateLibraryContext();
}

function renderLibrary() {
  const query = $('search').value.trim().toLowerCase();
  const filtered = strains.filter((strain) => {
    const profile = profileFor(strain.id);
    const haystack = [
      strain.name, strain.breeder, strain.cross_name, strain.lineage,
      ...(strain.flavors || []), ...(strain.tags || []), strain.general_notes,
      profileText(profile)
    ].join(' ').toLowerCase();
    return !query || haystack.includes(query);
  });

  $('strainCount').textContent = `${strains.length} strains`;
  $('researchedCount').textContent = `${researchByStrain.size} researched`;
  $('strainList').innerHTML = filtered.map((strain) => {
    const profile = profileFor(strain.id);
    const cross = profile?.exact_cross || strain.cross_name || 'Not researched';
    const creator = profile?.breeder_or_creator || strain.breeder || 'Unknown source';
    return `<article class="strain-card" data-id="${strain.id}">
      <div>
        <h3>${esc(strain.name)}</h3>
        <div class="cross">${esc(cross)}</div>
        <div class="creator">${esc(creator)}</div>
      </div>
      <span class="research-badge ${profile ? '' : 'missing'}">${profile ? 'PROFILE' : 'RESEARCH'}</span>
    </article>`;
  }).join('') || `<div class="empty">${strains.length ? 'No matching strains.' : 'This library is empty. Tap + to add a strain.'}</div>`;

  document.querySelectorAll('.strain-card').forEach((card) => {
    card.addEventListener('click', () => openDetail(card.dataset.id));
  });
}

function renderProjects() {
  $('projectList').innerHTML = projects.map((item) => `<article class="project-card">
    <h3>${esc(item.name)}</h3>
    <p class="meta">${esc(item.female_parent || 'Unknown female')} × ${esc(item.male_parent || 'Unknown male')}</p>
    <p>${esc(item.generation || '')}${item.stage ? ` · ${esc(item.stage)}` : ''}</p>
    ${item.notes ? `<p class="meta">${esc(item.notes)}</p>` : ''}
    <button class="button danger compact delete-project" data-id="${item.id}">Remove</button>
  </article>`).join('') || '<div class="empty">No breeding projects.</div>';
  document.querySelectorAll('.delete-project').forEach((button) => button.onclick = async () => {
    if (!confirm('Remove this project?')) return;
    await db.from('breeding_projects').delete().eq('id', button.dataset.id);
    loadLibrary();
  });
}

function renderSeeds() {
  $('seedList').innerHTML = seeds.map((item) => `<article class="seed-card">
    <h3>${esc(item.name)}</h3><p class="meta">${esc(item.breeder || 'Unknown breeder')}</p>
    <p>${item.packs || 0} packs · ${item.seeds_per_pack || 0} seeds per pack</p>
    ${item.notes ? `<p class="meta">${esc(item.notes)}</p>` : ''}
    <button class="button danger compact delete-seed" data-id="${item.id}">Remove</button>
  </article>`).join('') || '<div class="empty">No seed inventory yet.</div>';
  document.querySelectorAll('.delete-seed').forEach((button) => button.onclick = async () => {
    if (!confirm('Remove this seed entry?')) return;
    await db.from('seed_inventory').delete().eq('id', button.dataset.id);
    loadLibrary();
  });
}
