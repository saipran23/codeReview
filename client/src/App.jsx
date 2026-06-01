import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import { apiRequest, getAuthToken, setAuthToken } from './api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({
    prUrl: '',
    diffText: '',
    status: 'pending',
  });

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  const loadSession = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const me = await apiRequest('/api/auth/me');
      setUser(me);
    } catch (_error) {
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReviews = useCallback(async () => {
    try {
      const data = await apiRequest('/api/reviews');
      setReviews(data);
    } catch (requestError) {
      setError(requestError.message);
    }
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const tokenFromQuery = url.searchParams.get('token');

    if (tokenFromQuery) {
      setAuthToken(tokenFromQuery);
      url.searchParams.delete('token');
      window.history.replaceState({}, document.title, `${url.pathname}${url.search}`);
    }

    void loadSession();
    void loadReviews();
  }, [loadSession, loadReviews]);

  async function handleCreateReview(event) {
    event.preventDefault();
    setError('');

    try {
      await apiRequest('/api/reviews', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setForm({
        prUrl: '',
        diffText: '',
        status: 'pending',
      });
      await loadReviews();
    } catch (requestError) {
      if (requestError.message === 'UNAUTHORIZED') {
        setUser(null);
        setError('Session expired. Please login again.');
        return;
      }

      setError(requestError.message);
    }
  }

  function handleLogout() {
    setAuthToken(null);
    setUser(null);
    setError('');
    window.location.assign('/');
  }

  if (loading) {
    return <main className="app"><p>Checking login status...</p></main>;
  }

  return (
    <main className="app">
      <h1>Code Review Auth Demo</h1>
      <p>
        Current status:{' '}
        <strong>{isAuthenticated ? `Logged in as ${user.username}` : 'Logged out'}</strong>
      </p>

      <div className="actions">
        {!isAuthenticated ? (
          <a className="button" href="/api/auth/github">Login with GitHub</a>
        ) : (
          <button type="button" onClick={handleLogout}>Logout</button>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      <section className="panel">
        <h2>Create Protected Review</h2>
        <form onSubmit={handleCreateReview}>
          <label>
            PR URL
            <input
              required
              type="url"
              value={form.prUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, prUrl: event.target.value }))}
            />
          </label>
          <label>
            Diff Text
            <textarea
              required
              value={form.diffText}
              onChange={(event) => setForm((prev) => ({ ...prev, diffText: event.target.value }))}
            />
          </label>
          <label>
            Status
            <select
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
            >
              <option value="pending">pending</option>
              <option value="completed">completed</option>
            </select>
          </label>
          <button type="submit" disabled={!isAuthenticated}>Create review</button>
        </form>
      </section>

      <section className="panel">
        <h2>Public Reviews</h2>
        <ul>
          {reviews.map((review) => (
            <li key={review.id}>
              <strong>{review.status}</strong> — {review.prUrl}
            </li>
          ))}
          {reviews.length === 0 && <li>No reviews yet.</li>}
        </ul>
      </section>
    </main>
  );
}

export default App;
