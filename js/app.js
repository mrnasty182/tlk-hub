/* =========================================
   TLK HUB — JavaScript App
   The Loin Kings Creation Hub
   ========================================= */

// ----- Firebase Config -----
// Replace with your Firebase project config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// ----- State -----
let currentUser = null;
let currentSection = 'dashboard';
let currentSongId = null;
let currentSetlistId = null;
let currentJamId = null;
let allSongs = [];
let allSetlists = [];
let allJams = [];

// ----- Init Firebase -----
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
const storage = firebase.storage();

// =============================================
// AUTH
// =============================================
document.getElementById('google-sign-in').addEventListener('click', () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(err => showAuthError(err.message));
});

document.getElementById('email-sign-up').addEventListener('click', () => {
  const email = document.getElementById('email-input').value;
  const password = document.getElementById('password-input').value;
  if (!email || !password) { showAuthError('Enter email and password'); return; }
  auth.createUserWithEmailAndPassword(email, password).catch(err => showAuthError(err.message));
});

document.getElementById('email-sign-in').addEventListener('click', () => {
  const email = document.getElementById('email-input').value;
  const password = document.getElementById('password-input').value;
  if (!email || !password) { showAuthError('Enter email and password'); return; }
  auth.signInWithEmailAndPassword(email, password).catch(err => showAuthError(err.message));
});

document.getElementById('sign-out').addEventListener('click', () => auth.signOut());

auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    showApp();
    loadDashboard();
  } else {
    currentUser = null;
    showAuth();
  }
});

function showAuthError(msg) {
  document.getElementById('auth-error').textContent = msg;
}

function showAuth() {
  document.getElementById('auth-screen').classList.add('active');
  document.getElementById('app-screen').classList.remove('active');
}

function showApp() {
  document.getElementById('auth-screen').classList.remove('active');
  document.getElementById('app-screen').classList.add('active');
  if (currentUser.photoURL) {
    document.getElementById('user-avatar').src = currentUser.photoURL;
  }
  document.getElementById('user-name').textContent = currentUser.displayName || currentUser.email;
}

// =============================================
// NAVIGATION
// =============================================
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const section = btn.dataset.section;
    navigateTo(section);
  });
});

function navigateTo(section) {
  currentSection = section;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`[data-section="${section}"]`).classList.add('active');
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
  document.getElementById(section).classList.add('active');

  if (section === 'dashboard') loadDashboard();
  else if (section === 'songs') loadSongs();
  else if (section === 'setlists') loadSetlists();
  else if (section === 'calendar') loadCalendar();
}

// =============================================
// DASHBOARD
// =============================================
function loadDashboard() {
  const uid = currentUser.uid;
  const songsRef = db.ref(`songs`).orderByChild('owner').equalTo(uid);
  const jamsRef = db.ref(`jams`).orderByChild('date');

  Promise.all([
    songsRef.once('value').then(s => s.val() || {}),
    jamsRef.once('value').then(s => s.val() || {}),
    db.ref('setlists').orderByChild('owner').equalTo(uid).once('value').then(s => s.val() || {})
  ]).then(([songs, jams, setlists]) => {
    allSongs = Object.entries(songs).map(([id, d]) => ({ id, ...d }));
    allJams = Object.entries(jams).map(([id, d]) => ({ id, ...d }));
    allSetlists = Object.entries(setlists).map(([id, d]) => ({ id, ...d }));

    // Recent songs
    const recent = allSongs.slice(-5).reverse();
    const songsList = document.getElementById('recent-songs-list');
    songsList.innerHTML = recent.length ? recent.map(s => `<li onclick="openSong('${s.id}')">${s.title || 'Untitled'}</li>`).join('') : '<li style="color:var(--text-muted)">No songs yet</li>';

    // Upcoming jams
    const now = Date.now();
    const upcoming = allJams.filter(j => (j.timestamp || 0) > now).sort((a,b) => (a.timestamp||0) - (b.timestamp||0)).slice(0, 5);
    const jamsList = document.getElementById('upcoming-jams-list');
    jamsList.innerHTML = upcoming.length ? upcoming.map(j => `<li onclick="openJam('${j.id}')">${j.title} — ${j.date || ''}</li>`).join('') : '<li style="color:var(--text-muted)">No jams scheduled</li>';

    // Stats
    document.getElementById('stat-songs').textContent = allSongs.length;
    document.getElementById('stat-setlists').textContent = allSetlists.length;
    document.getElementById('stat-jams').textContent = allJams.length;
  });
}

// =============================================
// SONGS
// =============================================
document.getElementById('new-song-btn').addEventListener('click', openNewSongModal);
document.getElementById('new-song-btn-2').addEventListener('click', openNewSongModal);
document.getElementById('cancel-new-song').addEventListener('click', closeNewSongModal);
document.getElementById('create-song-btn').addEventListener('click', createSong);
document.getElementById('song-search').addEventListener('input', (e) => renderSongs(allSongs.filter(s => (s.title||'').toLowerCase().includes(e.target.value.toLowerCase()))));

function openNewSongModal() { document.getElementById('new-song-modal').classList.remove('hidden'); document.getElementById('new-song-name').focus(); }
function closeNewSongModal() { document.getElementById('new-song-modal').classList.add('hidden'); document.getElementById('new-song-name').value = ''; }

function createSong() {
  const title = document.getElementById('new-song-name').value.trim() || 'Untitled Song';
  const songRef = db.ref('songs').push();
  const songData = {
    title,
    key: '',
    bpm: 120,
    visibility: 'private',
    owner: currentUser.uid,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    sections: [
      { id: uid(), type: 'Verse', repeat: '1x', order: 0 }
    ],
    lyrics: '',
    clips: {},
    comments: {}
  };
  songRef.set(songData).then(() => {
    closeNewSongModal();
    openSong(songRef.key);
  });
}

function loadSongs() {
  const uid = currentUser.uid;
  db.ref('songs').orderByChild('owner').equalTo(uid).once('value').then(s => {
    allSongs = Object.entries(s.val() || {}).map(([id, d]) => ({ id, ...d }));
    renderSongs(allSongs);
  });
}

function renderSongs(songs) {
  const grid = document.getElementById('songs-grid');
  if (!songs.length) {
    grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:40px">No songs yet. Create one.</p>';
    return;
  }
  grid.innerHTML = songs.map(s => `
    <div class="song-card" onclick="openSong('${s.id}')">
      <div class="song-card-title">${s.title || 'Untitled'}</div>
      <div class="song-card-meta">
        ${s.key ? `<span class="song-card-tag">${s.key}</span>` : ''}
        ${s.bpm ? `<span class="song-card-tag">${s.bpm} BPM</span>` : ''}
        <span class="song-card-tag ${s.visibility === 'private' ? 'song-card-private' : 'song-card-shared'}">${s.visibility}</span>
      </div>
      <div class="song-card-sections">${(s.sections||[]).map(sec => sec.type).join(' · ') || 'No sections'}</div>
    </div>
  `).join('');
}

// =============================================
// SONG EDITOR
// =============================================
document.getElementById('back-to-songs').addEventListener('click', () => navigateTo('songs'));
document.getElementById('add-section-btn').addEventListener('click', addSection);
document.getElementById('save-song-btn').addEventListener('click', saveSong);
document.getElementById('delete-song-btn').addEventListener('click', deleteSong);
document.getElementById('add-comment-btn').addEventListener('click', addComment);

// Audio upload
const clipUploadArea = document.getElementById('clip-upload-area');
const clipFileInput = document.getElementById('clip-file-input');
clipUploadArea.addEventListener('click', () => clipFileInput.click());
clipUploadArea.addEventListener('dragover', e => { e.preventDefault(); clipUploadArea.style.borderColor = 'var(--pink)'; });
clipUploadArea.addEventListener('dragleave', () => clipUploadArea.style.borderColor = '');
clipUploadArea.addEventListener('drop', e => { e.preventDefault(); clipUploadArea.style.borderColor = ''; handleAudioUpload(e.dataTransfer.files[0]); });
clipFileInput.addEventListener('change', e => handleAudioUpload(e.target.files[0]));

function openSong(songId) {
  currentSongId = songId;
  document.getElementById('songs').classList.remove('active');
  document.getElementById('song-editor').classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  db.ref(`songs/${songId}`).once('value').then(snap => {
    const song = snap.val();
    if (!song) return;
    document.getElementById('song-title-input').value = song.title || '';
    document.getElementById('song-key').value = song.key || '';
    document.getElementById('song-bpm').value = song.bpm || 120;
    document.getElementById('song-visibility').value = song.visibility || 'private';
    document.getElementById('lyrics-editor').textContent = song.lyrics || '';
    renderSections(song.sections || []);
    renderClips(song.clips || {});
    renderComments(song.comments || {});
  });
}

function renderSections(sections) {
  const list = document.getElementById('sections-list');
  if (!sections.length) { list.innerHTML = '<p style="color:var(--text-muted);font-size:0.8rem">No sections yet</p>'; return; }
  list.innerHTML = sections.map((sec, i) => `
    <div class="section-item" draggable="true" data-index="${i}">
      <span class="section-drag-handle">⋮⋮</span>
      <div class="section-info">
        <select class="section-type-select input" onchange="updateSectionType(${i}, this.value)">
          ${['Verse','Chorus','Bridge','Intro','Outro','Tag','Pre-Chorus','Solo'].map(t => `<option ${sec.type===t?'selected':''}>${t}</option>`).join('')}
        </select>
        <input type="text" class="section-repeat input" value="${sec.repeat || '1x'}" onchange="updateSectionRepeat(${i}, this.value)">
      </div>
      <button class="btn btn-icon section-delete" onclick="deleteSection(${i})">✕</button>
    </div>
  `).join('');

  // Drag and drop
  const items = list.querySelectorAll('.section-item');
  items.forEach(item => {
    item.addEventListener('dragstart', e => { item.classList.add('dragging'); e.dataTransfer.setData('text/plain', item.dataset.index); });
    item.addEventListener('dragend', () => item.classList.remove('dragging'));
    item.addEventListener('dragover', e => { e.preventDefault(); item.classList.add('drag-over'); });
    item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
    item.addEventListener('drop', e => {
      e.preventDefault();
      item.classList.remove('drag-over');
      const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
      const toIdx = parseInt(item.dataset.index);
      if (fromIdx !== toIdx) reorderSections(fromIdx, toIdx);
    });
  });
}

function addSection() {
  const songRef = db.ref(`songs/${currentSongId}`);
  songRef.once('value').then(snap => {
    const song = snap.val();
    const sections = song.sections || [];
    const newSection = { id: uid(), type: 'Verse', repeat: '1x', order: sections.length };
    sections.push(newSection);
    songRef.child('sections').set(sections).then(() => renderSections(sections));
  });
}

function updateSectionType(idx, val) {
  updateSectionField(idx, 'type', val);
}
function updateSectionRepeat(idx, val) {
  updateSectionField(idx, 'repeat', val);
}
function updateSectionField(idx, key, val) {
  const songRef = db.ref(`songs/${currentSongId}/sections/${idx}/${key}`);
  songRef.set(val);
}

function deleteSection(idx) {
  const songRef = db.ref(`songs/${currentSongId}`);
  songRef.once('value').then(snap => {
    const song = snap.val();
    const sections = song.sections || [];
    sections.splice(idx, 1);
    songRef.child('sections').set(sections).then(() => renderSections(sections));
  });
}

function reorderSections(from, to) {
  const songRef = db.ref(`songs/${currentSongId}`);
  songRef.once('value').then(snap => {
    const song = snap.val();
    const sections = song.sections || [];
    const [moved] = sections.splice(from, 1);
    sections.splice(to, 0, moved);
    songRef.child('sections').set(sections).then(() => renderSections(sections));
  });
}

function saveSong() {
  const title = document.getElementById('song-title-input').value.trim();
  const key = document.getElementById('song-key').value;
  const bpm = parseInt(document.getElementById('song-bpm').value) || 120;
  const visibility = document.getElementById('song-visibility').value;
  const lyrics = document.getElementById('lyrics-editor').textContent;
  const notes = document.getElementById('clip-notes-input').value.trim();

  db.ref(`songs/${currentSongId}`).update({
    title, key, bpm, visibility, lyrics, notes,
    updatedAt: Date.now()
  }).then(() => {
    // flash save confirmation
    const btn = document.getElementById('save-song-btn');
    btn.textContent = 'Saved!';
    setTimeout(() => btn.textContent = 'Save Song', 1500);
  });
}

function deleteSong() {
  if (!confirm('Delete this song? This cannot be undone.')) return;
  db.ref(`songs/${currentSongId}`).remove().then(() => navigateTo('songs'));
}

function renderClips(clips) {
  const list = document.getElementById('clips-list');
  const entries = Object.entries(clips);
  if (!entries.length) { list.innerHTML = '<p style="color:var(--text-muted);font-size:0.8rem">No audio clips yet</p>'; return; }
  list.innerHTML = entries.map(([id, clip]) => `
    <div class="clip-item">
      ${clip.url ? `<audio src="${clip.url}" controls class="clip-audio"></audio>` : ''}
      <div class="clip-note-text">${clip.note || ''}</div>
      <button class="clip-delete" onclick="deleteClip('${id}')">Delete clip</button>
    </div>
  `).join('');
}

function handleAudioUpload(file) {
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) { alert('Max 10MB'); return; }
  const uid = currentUser.uid;
  const path = `clips/${uid}/${Date.now()}_${file.name}`;
  const ref = storage.ref(path);
  ref.put(file).then(snap => snap.ref.getDownloadURL()).then(url => {
    const clipId = db.ref(`songs/${currentSongId}/clips`).push().key;
    db.ref(`songs/${currentSongId}/clips/${clipId}`).set({
      url,
      name: file.name,
      note: document.getElementById('clip-notes-input').value.trim(),
      uploadedAt: Date.now()
    }).then(() => {
      document.getElementById('clip-notes-input').value = '';
      db.ref(`songs/${currentSongId}`).once('value').then(s => renderClips(s.val().clips || {}));
    });
  });
}

function deleteClip(clipId) {
  db.ref(`songs/${currentSongId}/clips/${clipId}`).remove().then(() => {
    db.ref(`songs/${currentSongId}`).once('value').then(s => renderClips(s.val().clips || {}));
  });
}

function renderComments(comments) {
  const list = document.getElementById('comments-list');
  const entries = Object.entries(comments).sort((a,b) => b[1].timestamp - a[1].timestamp);
  if (!entries.length) { list.innerHTML = '<p style="color:var(--text-muted);font-size:0.8rem">No comments yet</p>'; return; }
  list.innerHTML = entries.map(([id, c]) => `
    <div class="comment-item">
      <div class="comment-meta">
        <span class="comment-author">${c.author || 'Unknown'}</span>
        <span class="comment-time">${new Date(c.timestamp).toLocaleString()}</span>
      </div>
      <div class="comment-text">${c.text || ''}</div>
    </div>
  `).join('');
}

function addComment() {
  const text = document.getElementById('comment-text').value.trim();
  if (!text) return;
  const commentId = db.ref(`songs/${currentSongId}/comments`).push().key;
  db.ref(`songs/${currentSongId}/comments/${commentId}`).set({
    text,
    author: currentUser.displayName || currentUser.email,
    timestamp: Date.now()
  }).then(() => {
    document.getElementById('comment-text').value = '';
    db.ref(`songs/${currentSongId}`).once('value').then(s => renderComments(s.val().comments || {}));
  });
}

// =============================================
// SETLISTS
// =============================================
document.getElementById('new-setlist-btn').addEventListener('click', openNewSetlistModal);
document.getElementById('cancel-new-setlist').addEventListener('click', closeNewSetlistModal);
document.getElementById('create-setlist-btn').addEventListener('click', createSetlist);
document.getElementById('back-to-setlists').addEventListener('click', () => navigateTo('setlists'));
document.getElementById('save-setlist-btn').addEventListener('click', saveSetlist);
document.getElementById('delete-setlist-btn').addEventListener('click', deleteSetlist);
document.getElementById('add-to-setlist-btn').addEventListener('click', toggleSongPicker);

function openNewSetlistModal() { document.getElementById('new-setlist-modal').classList.remove('hidden'); document.getElementById('new-setlist-name').focus(); }
function closeNewSetlistModal() { document.getElementById('new-setlist-modal').classList.add('hidden'); document.getElementById('new-setlist-name').value = ''; }

function createSetlist() {
  const title = document.getElementById('new-setlist-name').value.trim() || 'Untitled Setlist';
  const ref = db.ref('setlists').push();
  ref.set({ title, owner: currentUser.uid, songs: [], createdAt: Date.now(), updatedAt: Date.now() }).then(() => {
    closeNewSetlistModal();
    openSetlist(ref.key);
  });
}

function loadSetlists() {
  db.ref('setlists').orderByChild('owner').equalTo(currentUser.uid).once('value').then(snap => {
    allSetlists = Object.entries(snap.val() || {}).map(([id, d]) => ({ id, ...d }));
    renderSetlists(allSetlists);
  });
}

function renderSetlists(setlists) {
  const grid = document.getElementById('setlists-grid');
  if (!setlists.length) { grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:40px">No setlists yet. Create one.</p>'; return; }
  grid.innerHTML = setlists.map(s => `
    <div class="setlist-card" onclick="openSetlist('${s.id}')">
      <div class="setlist-card-title">${s.title || 'Untitled'}</div>
      <div class="setlist-card-count">${(s.songs||[]).length} songs</div>
    </div>
  `).join('');
}

function openSetlist(id) {
  currentSetlistId = id;
  document.getElementById('setlists').classList.remove('active');
  document.getElementById('setlist-detail').classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  db.ref(`setlists/${id}`).once('value').then(snap => {
    const sl = snap.val();
    document.getElementById('setlist-title-input').value = sl.title || '';
    renderSetlistSongs(sl.songs || []);
  });
}

function renderSetlistSongs(songs) {
  const list = document.getElementById('setlist-songs');
  if (!songs.length) { list.innerHTML = '<li style="color:var(--text-muted)">No songs in this setlist</li>'; return; }
  list.innerHTML = songs.map((s, i) => `<li draggable="true" data-idx="${i}">${s.title || s.songId}</li>`).join('');

  // Drag reorder
  list.querySelectorAll('li').forEach(item => {
    item.addEventListener('dragstart', e => { item.style.opacity='0.5'; e.dataTransfer.setData('text/plain', item.dataset.idx); });
    item.addEventListener('dragend', () => item.style.opacity='');
    item.addEventListener('dragover', e => e.preventDefault());
    item.addEventListener('drop', e => {
      e.preventDefault();
      const from = parseInt(e.dataTransfer.getData('text/plain'));
      const to = parseInt(item.dataset.idx);
      if (from !== to) {
        const [moved] = songs.splice(from, 1);
        songs.splice(to, 0, moved);
        db.ref(`setlists/${currentSetlistId}/songs`).set(songs).then(() => renderSetlistSongs(songs));
      }
    });
  });
}

function toggleSongPicker() {
  const picker = document.getElementById('song-picker');
  if (picker.classList.contains('hidden')) {
    picker.classList.remove('hidden');
    // Load all songs into picker
    db.ref('songs').orderByChild('owner').equalTo(currentUser.uid).once('value').then(snap => {
      const songs = Object.entries(snap.val() || {}).map(([id, d]) => ({ id, ...d }));
      picker.innerHTML = songs.map(s => `<li onclick="addSongToSetlist('${s.id}', '${s.title}')">${s.title || 'Untitled'}</li>`).join('') || '<li>No songs found</li>';
    });
  } else {
    picker.classList.add('hidden');
  }
}

function addSongToSetlist(songId, title) {
  db.ref(`setlists/${currentSetlistId}/songs`).once('value').then(snap => {
    const songs = snap.val() || [];
    if (!songs.find(s => s.songId === songId)) {
      songs.push({ songId, title });
      db.ref(`setlists/${currentSetlistId}/songs`).set(songs).then(() => {
        document.getElementById('song-picker').classList.add('hidden');
        renderSetlistSongs(songs);
      });
    }
  });
}

function saveSetlist() {
  const title = document.getElementById('setlist-title-input').value.trim();
  db.ref(`setlists/${currentSetlistId}`).update({ title, updatedAt: Date.now() }).then(() => {
    const btn = document.getElementById('save-setlist-btn');
    btn.textContent = 'Saved!';
    setTimeout(() => btn.textContent = 'Save Setlist', 1500);
  });
}

function deleteSetlist() {
  if (!confirm('Delete this setlist?')) return;
  db.ref(`setlists/${currentSetlistId}`).remove().then(() => navigateTo('setlists'));
}

// =============================================
// CALENDAR / JAMS
// =============================================
document.getElementById('new-jam-btn').addEventListener('click', openNewJamModal);
document.getElementById('cancel-new-jam').addEventListener('click', closeNewJamModal);
document.getElementById('create-jam-btn').addEventListener('click', createJam);
document.getElementById('back-to-calendar').addEventListener('click', () => navigateTo('calendar'));
document.getElementById('save-jam-btn').addEventListener('click', saveJam);
document.getElementById('delete-jam-btn').addEventListener('click', deleteJam);
document.getElementById('add-song-to-jam-btn').addEventListener('click', toggleJamSongPicker);

function openNewJamModal() { document.getElementById('new-jam-modal').classList.remove('hidden'); document.getElementById('new-jam-title').focus(); }
function closeNewJamModal() { document.getElementById('new-jam-modal').classList.add('hidden'); }

function createJam() {
  const title = document.getElementById('new-jam-title').value.trim() || 'Jam Session';
  const date = document.getElementById('new-jam-date').value;
  const time = document.getElementById('new-jam-time').value;
  const location = document.getElementById('new-jam-location').value.trim();
  const timestamp = date ? new Date(`${date}T${time||'00:00'}`).getTime() : Date.now();
  const ref = db.ref('jams').push();
  ref.set({ title, date, time, location, timestamp, owner: currentUser.uid, songs: [], createdAt: Date.now(), updatedAt: Date.now() }).then(() => {
    closeNewJamModal();
    openJam(ref.key);
  });
}

function loadCalendar() {
  db.ref('jams').orderByChild('owner').equalTo(currentUser.uid).once('value').then(snap => {
    allJams = Object.entries(snap.val() || {}).map(([id, d]) => ({ id, ...d }));
    renderJams(allJams);
  });
}

function renderJams(jams) {
  const grid = document.getElementById('calendar-grid');
  if (!jams.length) { grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:40px">No jams scheduled. Schedule one.</p>'; return; }
  grid.innerHTML = jams.sort((a,b) => (a.timestamp||0) - (b.timestamp||0)).map(j => `
    <div class="jam-card" onclick="openJam('${j.id}')">
      <div class="jam-card-title">${j.title || 'Untitled'}</div>
      <div class="jam-card-date">${j.date || ''} ${j.time || ''}</div>
      <div class="jam-card-location">${j.location || 'No location'}</div>
      <div class="jam-card-songs">${(j.songs||[]).length} songs attached</div>
    </div>
  `).join('');
}

function openJam(id) {
  currentJamId = id;
  document.getElementById('calendar').classList.remove('active');
  document.getElementById('jam-detail').classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  db.ref(`jams/${id}`).once('value').then(snap => {
    const jam = snap.val();
    document.getElementById('jam-title-input').value = jam.title || '';
    document.getElementById('jam-date').value = jam.date || '';
    document.getElementById('jam-time').value = jam.time || '';
    document.getElementById('jam-location').value = jam.location || '';
    renderJamSongs(jam.songs || []);
  });
}

function renderJamSongs(songs) {
  const list = document.getElementById('jam-songs-list');
  list.innerHTML = songs.length ? songs.map(s => `<li>${s.title || s.songId}</li>`).join('') : '<li style="color:var(--text-muted)">No songs attached</li>';
}

function toggleJamSongPicker() {
  const picker = document.getElementById('jam-song-picker');
  if (picker.classList.contains('hidden')) {
    picker.classList.remove('hidden');
    db.ref('songs').orderByChild('owner').equalTo(currentUser.uid).once('value').then(snap => {
      const songs = Object.entries(snap.val() || {}).map(([id, d]) => ({ id, ...d }));
      picker.innerHTML = songs.map(s => `<li onclick="addSongToJam('${s.id}', '${s.title}')">${s.title || 'Untitled'}</li>`).join('') || '<li>No songs</li>';
    });
  } else {
    picker.classList.add('hidden');
  }
}

function addSongToJam(songId, title) {
  db.ref(`jams/${currentJamId}/songs`).once('value').then(snap => {
    const songs = snap.val() || [];
    if (!songs.find(s => s.songId === songId)) {
      songs.push({ songId, title });
      db.ref(`jams/${currentJamId}/songs`).set(songs).then(() => {
        document.getElementById('jam-song-picker').classList.add('hidden');
        renderJamSongs(songs);
      });
    }
  });
}

function saveJam() {
  const title = document.getElementById('jam-title-input').value.trim();
  const date = document.getElementById('jam-date').value;
  const time = document.getElementById('jam-time').value;
  const location = document.getElementById('jam-location').value.trim();
  const timestamp = date ? new Date(`${date}T${time||'00:00'}`).getTime() : Date.now();
  db.ref(`jams/${currentJamId}`).update({ title, date, time, location, timestamp, updatedAt: Date.now() }).then(() => {
    const btn = document.getElementById('save-jam-btn');
    btn.textContent = 'Saved!';
    setTimeout(() => btn.textContent = 'Save Jam', 1500);
  });
}

function deleteJam() {
  if (!confirm('Delete this jam?')) return;
  db.ref(`jams/${currentJamId}`).remove().then(() => navigateTo('calendar'));
}

// =============================================
// UTILITIES
// =============================================
function uid() {
  return Math.random().toString(36).substr(2, 9);
}

// Global stubs for onclick handlers
window.openSong = openSong;
window.openJam = openJam;
window.updateSectionType = updateSectionType;
window.updateSectionRepeat = updateSectionRepeat;
window.deleteSection = deleteSection;
window.deleteClip = deleteClip;
window.addSongToSetlist = addSongToSetlist;
window.addSongToJam = addSongToJam;