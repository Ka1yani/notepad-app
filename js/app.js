'use strict';

const STORAGE_KEY = 'notepad-notes';

// ── State ──
let notes = [];
let activeId = null;
let saveTimer = null;

// ── Utilities ──
function generateId() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

// ── Persistence ──
function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.notes)) {
        notes = parsed.notes;
      }
    }
  } catch (e) {
    notes = [];
  }
  notes.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
}

function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ notes }));
}

// ── DOM References ──
const notesList     = document.getElementById('notes-list');
const emptyList     = document.getElementById('empty-list');
const emptyEditor   = document.getElementById('empty-editor');
const editorContent = document.getElementById('editor-content');
const editorMeta    = document.getElementById('editor-meta');
const noteTitle     = document.getElementById('note-title');
const noteBody      = document.getElementById('note-body');
const btnDelete     = document.getElementById('btn-delete');
const search        = document.getElementById('search');
const modalOverlay  = document.getElementById('modal-overlay');
const modalMsg      = document.getElementById('modal-msg');
const fileInput     = document.getElementById('file-input');

// ── Render ──
function renderList() {
  const query = search.value.trim().toLowerCase();
  const filtered = query
    ? notes.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query)
      )
    : notes;

  [...notesList.querySelectorAll('.note-item')].forEach(el => el.remove());
  emptyList.style.display = filtered.length === 0 ? 'block' : 'none';

  filtered.forEach(note => {
    const div = document.createElement('div');
    div.className = 'note-item' + (note.id === activeId ? ' active' : '');
    div.dataset.id = note.id;
    div.innerHTML =
      '<div class="note-item-content">' +
        '<div class="note-item-title">' + (esc(note.title) || 'Untitled') + '</div>' +
        '<div class="note-item-preview">' + (esc(note.content.split('\n')[0]) || 'No content') + '</div>' +
        '<div class="note-item-date">' + formatDate(note.updated_at) + '</div>' +
      '</div>' +
      '<button class="note-item-delete" title="Delete note" aria-label="Delete note">🗑️</button>';
    div.addEventListener('click', function () { selectNote(note.id); });
    const deleteBtn = div.querySelector('.note-item-delete');
    deleteBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      selectNote(note.id);
      openDeleteModal();
    });
    notesList.appendChild(div);
  });
}

function renderEditor() {
  const note = notes.find(function (n) { return n.id === activeId; });
  if (!note) {
    emptyEditor.style.display = 'flex';
    editorContent.style.display = 'none';
    btnDelete.style.display = 'none';
    editorMeta.textContent = '';
    return;
  }
  emptyEditor.style.display = 'none';
  editorContent.style.display = 'flex';
  btnDelete.style.display = 'flex';
  noteTitle.value = note.title;
  noteBody.value  = note.content;
  editorMeta.innerHTML =
    '<span>Created: ' + formatDate(note.created_at) + '</span>' +
    '<span>Last edited: ' + formatDate(note.updated_at) + '</span>';
}

// ── Actions ──
function createNote() {
  var now  = new Date().toISOString();
  var note = {
    id: generateId(),
    title: '',
    content: '',
    created_at: now,
    updated_at: now
  };
  notes.unshift(note);
  saveNotes();
  activeId = note.id;
  renderList();
  renderEditor();
  noteTitle.focus();
}

function selectNote(id) {
  activeId = id;
  renderList();
  renderEditor();
}

function deleteActiveNote() {
  notes = notes.filter(function (n) { return n.id !== activeId; });
  saveNotes();
  activeId = null;
  renderList();
  renderEditor();
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(function () {
    var note = notes.find(function (n) { return n.id === activeId; });
    if (!note) return;
    note.title      = noteTitle.value;
    note.content    = noteBody.value;
    note.updated_at = new Date().toISOString();
    notes.sort(function (a, b) { return new Date(b.updated_at) - new Date(a.updated_at); });
    saveNotes();
    renderList();
    editorMeta.innerHTML =
      '<span>Created: ' + formatDate(note.created_at) + '</span>' +
      '<span>Last edited: ' + formatDate(note.updated_at) + '</span>';
  }, 400);
}

// ── Export ──
function exportNotes() {
  var data = JSON.stringify({ notes: notes }, null, 2);
  var blob = new Blob([data], { type: 'application/json' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  var date = new Date().toISOString().split('T')[0];
  a.href     = url;
  a.download = 'notes_' + date + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Import ──
function importNotes(file) {
  var reader = new FileReader();
  reader.onload = function (e) {
    try {
      var parsed = JSON.parse(e.target.result);
      if (!parsed || !Array.isArray(parsed.notes)) {
        alert('Invalid notes.json format.');
        return;
      }
      var map = {};
      notes.forEach(function (n) { map[n.id] = n; });
      parsed.notes.forEach(function (n) {
        if (n.id && typeof n.title === 'string' && typeof n.content === 'string') {
          map[n.id] = {
            id:         n.id,
            title:      n.title,
            content:    n.content,
            created_at: n.created_at || new Date().toISOString(),
            updated_at: n.updated_at || new Date().toISOString()
          };
        }
      });
      notes = Object.values(map).sort(function (a, b) {
        return new Date(b.updated_at) - new Date(a.updated_at);
      });
      saveNotes();
      renderList();
      renderEditor();
    } catch (err) {
      alert('Could not read the file. Make sure it is a valid notes.json.');
    }
  };
  reader.readAsText(file);
}

// ── Delete Modal ──
function openDeleteModal() {
  var note  = notes.find(function (n) { return n.id === activeId; });
  var title = (note && note.title) ? '"' + note.title + '"' : 'this note';
  modalMsg.textContent = 'Are you sure you want to delete ' + title + '? This cannot be undone.';
  modalOverlay.classList.add('open');
}

// ── Event Listeners ──
document.getElementById('btn-new').addEventListener('click', createNote);
document.getElementById('btn-empty-new').addEventListener('click', createNote);
document.getElementById('btn-export').addEventListener('click', exportNotes);
document.getElementById('btn-import').addEventListener('click', function () { fileInput.click(); });

fileInput.addEventListener('change', function (e) {
  if (e.target.files[0]) importNotes(e.target.files[0]);
  e.target.value = '';
});

btnDelete.addEventListener('click', openDeleteModal);

document.getElementById('modal-cancel').addEventListener('click', function () {
  modalOverlay.classList.remove('open');
});

document.getElementById('modal-confirm').addEventListener('click', function () {
  modalOverlay.classList.remove('open');
  deleteActiveNote();
});

modalOverlay.addEventListener('click', function (e) {
  if (e.target === modalOverlay) modalOverlay.classList.remove('open');
});

noteTitle.addEventListener('input', scheduleSave);
noteBody.addEventListener('input', scheduleSave);
search.addEventListener('input', renderList);

// ── Init ──
loadNotes();
renderList();
renderEditor();
