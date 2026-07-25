(async () => {
function subscribeToLibrary() {
  if (channel) db.removeChannel(channel);
  channel = db.channel(`nutt-bank-${ownerId()}-${Date.now()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'strains', filter: `owner_id=eq.${ownerId()}` }, loadLibrary)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'strain_notes', filter: `owner_id=eq.${ownerId()}` }, loadLibrary)
    .subscribe();
}

async function enterApp() {
  if (!session || enteringApp || recoveryMode) return;
  enteringApp = true;
  hide('auth');
  show('app');
  status('Connecting…');
  try {
    await ensureLibraryProfile();
    await loadLibraryProfiles();
    await loadLibrary();
    subscribeToLibrary();
  } catch (error) {
    console.error(error);
    status('Connection error');
    setAppMessage(`The library could not load: ${error.message || error}`);
  } finally {
    enteringApp = false;
  }
}

function credentials() {
  return { email: lower($('email').value), password: $('password').value };
}

$('signin').onclick = async () => {
  const { email, password } = credentials();
  if (!email || !password) return setAuthMessage('Enter both email and password.', 'error');
  setAuthBusy(true);
  setAuthMessage('Signing in…');
  const result = await db.auth.signInWithPassword({ email, password });
  setAuthBusy(false);
  if (result.error) setAuthMessage(friendlyAuthError(result.error), 'error');
};

$('signup').onclick = async () => {
  const { email, password } = credentials();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return setAuthMessage('Enter a valid email address.', 'error');
  if (password.length < 6) return setAuthMessage('Use a password with at least 6 characters.', 'error');
  setAuthBusy(true);
  setAuthMessage('Creating account…');
  const result = await db.auth.signUp({ email, password, options: { emailRedirectTo: SITE_URL } });
  setAuthBusy(false);
  if (result.error) return setAuthMessage(friendlyAuthError(result.error), 'error');
  if (result.data.session) return setAuthMessage('Account created. Opening the library…', 'success');
  if (result.data.user && Array.isArray(result.data.user.identities) && result.data.user.identities.length === 0) {
    return setAuthMessage('That email may already have an account. Try Sign in or Forgot password.', 'error');
  }
  setAuthMessage('Account created. Open the confirmation email, then return here and sign in.', 'success');
};

$('forgotPassword').onclick = async () => {
  const email = lower($('email').value);
  if (!email) return setAuthMessage('Enter your email first.', 'error');
  setAuthBusy(true);
  setAuthMessage('Sending reset email…');
  const result = await db.auth.resetPasswordForEmail(email, { redirectTo: `${SITE_URL}/?recovery=1` });
  setAuthBusy(false);
  setAuthMessage(result.error ? friendlyAuthError(result.error) : 'Password reset email sent.', result.error ? 'error' : 'success');
};

$('saveNewPassword').onclick = async () => {
  const password = $('newPassword').value;
  if (password.length < 6) { $('resetMessage').textContent = 'Use at least 6 characters.'; return; }
  $('saveNewPassword').disabled = true;
  $('resetMessage').textContent = 'Saving…';
  const result = await db.auth.updateUser({ password });
  $('saveNewPassword').disabled = false;
  if (result.error) { $('resetMessage').textContent = friendlyAuthError(result.error); return; }
  recoveryMode = false;
  hide('resetPanel');
  show('loginPanel');
  $('resetMessage').textContent = '';
  await enterApp();
};

$('password').onkeydown = (event) => { if (event.key === 'Enter') $('signin').click(); };
$('search').oninput = renderLibrary;
$('addButton').onclick = () => openStrainForm();
$('saveManual').onclick = saveManualStrain;
$('researchFromForm').onclick = () => runResearch($('strainName').value, $('sourceHints').value, $('strainId').value || null);
$('applyResearch').onclick = applyPendingResearch;
$('researchCurrent').onclick = () => currentStrain && runResearch(currentStrain.name, '', currentStrain.id);
$('editCurrent').onclick = () => { if (currentStrain) { hide('detailModal'); openStrainForm(currentStrain); } };
$('addProject').onclick = () => configureSimpleModal('project');
$('addSeed').onclick = () => configureSimpleModal('seed');
$('signout').onclick = () => db.auth.signOut();
$('librarySelect').onchange = async (event) => {
  activeOwnerId = event.target.value;
  updateLibraryContext();
  status('Switching library…');
  try { await loadLibrary(); subscribeToLibrary(); } catch (error) { setAppMessage(error.message || String(error)); }
};
document.querySelectorAll('[data-close]').forEach((button) => button.onclick = () => hide(button.dataset.close));
document.querySelectorAll('.bottom-nav button').forEach((button) => button.onclick = () => setPage(button.dataset.page));

const urlError = new URLSearchParams(window.location.search).get('error_description');
if (urlError) setAuthMessage(decodeURIComponent(urlError), 'error');
const initial = await db.auth.getSession();
session = initial.data.session;
db.auth.onAuthStateChange((event, nextSession) => {
  window.setTimeout(async () => {
    session = nextSession;
    if (event === 'PASSWORD_RECOVERY') {
      recoveryMode = true;
      hide('loginPanel'); show('resetPanel'); show('auth'); hide('app');
      return;
    }
    if (session) await enterApp();
    else {
      activeOwnerId = null;
      libraryProfiles = [];
      if (channel) db.removeChannel(channel);
      show('auth'); hide('app'); show('loginPanel'); hide('resetPanel');
    }
  }, 0);
});
if (session && !new URLSearchParams(window.location.search).has('recovery')) await enterApp(); else show('auth');

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js?build=4').catch(() => {});
})().catch((error) => { console.error(error); const message=document.getElementById('authMessage'); if(message) message.textContent=error.message || String(error); });
