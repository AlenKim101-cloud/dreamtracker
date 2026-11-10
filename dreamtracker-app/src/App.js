import { useEffect, useMemo, useState } from 'react';
import './App.css';

const STORAGE_KEY = 'dreamtracker.entries';
const moods = ['Peaceful', 'Joyful', 'Curious', 'Confused', 'Anxious', 'Scary', 'Sad', 'Exciting'];
const moodIcons = {
  Peaceful: '☾',
  Joyful: '☀',
  Curious: '✦',
  Confused: '☁',
  Anxious: '〰',
  Scary: '◌',
  Sad: '⌁',
  Exciting: '✧',
};

const today = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
};

const emptyForm = () => ({ title: '', date: today(), mood: 'Peaceful', description: '' });

function formatDate(value) {
  if (!value) return 'Date unknown';
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function App() {
  const [dreams, setDreams] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState('All moods');
  const [deleteId, setDeleteId] = useState(null);
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) {
          throw new Error('Saved dreams are in an unexpected format.');
        }
        setDreams(parsed);
      }
    } catch (error) {
      setStorageError(`Could not load saved dreams: ${error.message}`);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dreams));
    } catch (error) {
      setStorageError(`Could not save your dreams: ${error.message}`);
    }
  }, [dreams, loaded]);

  const sortedDreams = useMemo(
    () => [...dreams].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt),
    [dreams]
  );
  const visibleDreams = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return sortedDreams.filter((dream) => {
      const matchesQuery =
        !normalizedQuery ||
        `${dream.title} ${dream.description}`.toLowerCase().includes(normalizedQuery);
      return matchesQuery && (moodFilter === 'All moods' || dream.mood === moodFilter);
    });
  }, [sortedDreams, query, moodFilter]);
  const recentMood = sortedDreams[0]?.mood;

  function updateForm(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function submitDream(event) {
    event.preventDefault();
    const dream = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      createdAt: editingId
        ? dreams.find((item) => item.id === editingId)?.createdAt || Date.now()
        : Date.now(),
    };

    if (editingId) {
      setDreams((current) => current.map((item) => (item.id === editingId ? { ...dream, id: editingId } : item)));
    } else {
      setDreams((current) => [{ ...dream, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` }, ...current]);
    }
    setForm(emptyForm());
    setEditingId(null);
  }

  function editDream(dream) {
    setForm({
      title: dream.title,
      date: dream.date,
      mood: dream.mood,
      description: dream.description,
    });
    setEditingId(dream.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setForm(emptyForm());
    setEditingId(null);
  }

  function confirmDelete() {
    setDreams((current) => current.filter((dream) => dream.id !== deleteId));
    setDeleteId(null);
    if (editingId === deleteId) cancelEdit();
  }

  if (!loaded) {
    return <main className="loading-screen">Gathering your dreams…</main>;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Dreamspace home">
          <span className="brand-mark">✦</span>
          <span>dreamspace</span>
        </a>
        <span className="topbar-note"><span className="status-dot" /> Your private dream journal</span>
      </header>

      <section className="welcome" id="home">
        <div className="welcome-copy">
          <p className="eyebrow">A LITTLE SPACE FOR YOUR SLEEPING MIND</p>
          <h1>Good morning,<br /><span>dreamer.</span></h1>
          <p className="welcome-subtitle">Catch the fragments before they drift away.</p>
        </div>
        <div className="moon-art" aria-hidden="true">
          <span className="moon">☾</span><span className="sparkle sparkle-one">✦</span><span className="sparkle sparkle-two">·</span><span className="sparkle sparkle-three">✧</span>
        </div>
      </section>

      <section className="stats" aria-label="Journal summary">
        <article className="stat-card">
          <span className="stat-icon">✎</span>
          <span className="stat-label">DREAMS RECORDED</span>
          <strong>{dreams.length}</strong>
          <span className="stat-caption">{dreams.length === 1 ? 'one little story saved' : 'stories saved in your journal'}</span>
        </article>
        <article className="stat-card">
          <span className="stat-icon">☾</span>
          <span className="stat-label">LAST REMEMBERED</span>
          <strong className="stat-date">{sortedDreams[0] ? formatDate(sortedDreams[0].date) : 'Not yet'}</strong>
          <span className="stat-caption">Every detail is worth keeping</span>
        </article>
        <article className="stat-card">
          <span className="stat-icon">✧</span>
          <span className="stat-label">RECENT MOOD</span>
          <strong>{recentMood || '—'}</strong>
          <span className="stat-caption">The feeling that stayed with you</span>
        </article>
      </section>

      {storageError && (
        <div className="storage-alert" role="alert">
          {storageError}
          <button type="button" onClick={() => setStorageError('')} aria-label="Dismiss storage message">×</button>
        </div>
      )}

      <div className="workspace">
        <section className="journal-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR NIGHTLY NOTES</p>
              <h2>Dream journal <span className="count-pill">{dreams.length}</span></h2>
            </div>
          </div>

          <div className="filters">
            <label className="search-field">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Search your dreams…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search dreams"
              />
            </label>
            <select value={moodFilter} onChange={(event) => setMoodFilter(event.target.value)} aria-label="Filter by mood">
              <option>All moods</option>
              {moods.map((mood) => <option key={mood}>{mood}</option>)}
            </select>
          </div>

          {visibleDreams.length ? (
            <div className="dream-list">
              {visibleDreams.map((dream) => (
                <article className="dream-card" key={dream.id}>
                  <div className={`dream-mood mood-${dream.mood.toLowerCase()}`} aria-label={`${dream.mood} mood`}>
                    {moodIcons[dream.mood] || '✦'}
                  </div>
                  <div className="dream-content">
                    <div className="dream-meta"><span>{formatDate(dream.date)}</span><span className="meta-separator">·</span><span>{dream.mood}</span></div>
                    <h3>{dream.title}</h3>
                    <p>{dream.description}</p>
                    <div className="dream-actions">
                      <button type="button" className="text-button" onClick={() => editDream(dream)}>Edit entry</button>
                      <button type="button" className="text-button delete-button" onClick={() => setDeleteId(dream.id)}>Delete</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-moon">☾</span>
              <h3>{dreams.length ? 'No dreams found' : 'Your journal is a blank page'}</h3>
              <p>{dreams.length ? 'Try another search or mood filter.' : 'When you wake up, leave a little note about where your mind wandered.'}</p>
            </div>
          )}
        </section>

        <aside className="entry-panel">
          <div className="entry-heading">
            <span className="entry-icon">✦</span>
            <div>
              <p className="eyebrow">{editingId ? 'UPDATE YOUR MEMORY' : 'SAVE A NEW MEMORY'}</p>
              <h2>{editingId ? 'Edit this dream' : 'Remember a dream?'}</h2>
            </div>
          </div>
          <p className="entry-intro">Even the smallest detail can open a whole new world.</p>
          <form onSubmit={submitDream}>
            <label htmlFor="dream-title">Dream title</label>
            <input id="dream-title" name="title" value={form.title} onChange={updateForm} placeholder="The one with the flying whales…" maxLength="100" required />
            <div className="form-row">
              <div>
                <label htmlFor="dream-date">When was it?</label>
                <input id="dream-date" name="date" type="date" value={form.date} onChange={updateForm} required />
              </div>
              <div>
                <label htmlFor="dream-mood">How did it feel?</label>
                <select id="dream-mood" name="mood" value={form.mood} onChange={updateForm}>
                  {moods.map((mood) => <option key={mood}>{mood}</option>)}
                </select>
              </div>
            </div>
            <label htmlFor="dream-description">Tell the story</label>
            <textarea id="dream-description" name="description" value={form.description} onChange={updateForm} placeholder="Write down everything you can remember…" rows="5" maxLength="2000" required />
            <div className="form-footer">
              <span>Saved privately on this device</span>
              <button type="submit" className="save-button">{editingId ? 'Save changes' : 'Save dream'} <span aria-hidden="true">→</span></button>
            </div>
            {editingId && <button type="button" className="cancel-edit" onClick={cancelEdit}>Cancel editing</button>}
          </form>
        </aside>
      </div>

      {deleteId && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setDeleteId(null);
        }}>
          <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description">
            <span className="dialog-moon">☾</span>
            <h2 id="delete-title">Let this dream go?</h2>
            <p id="delete-description">This entry will be removed from your journal for good.</p>
            <div className="dialog-actions">
              <button type="button" className="cancel-button" onClick={() => setDeleteId(null)}>Keep it</button>
              <button type="button" className="confirm-delete" onClick={confirmDelete}>Delete dream</button>
            </div>
          </section>
        </div>
      )}
      <footer className="page-footer">Made for the moments that stay with you <span>✦</span></footer>
    </main>
  );
}

export default App;
