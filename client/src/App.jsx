import { useEffect, useState } from 'react';
import './App.css';
import { apiRequest, getAuthToken, setAuthToken } from './api';
import { getPullRequestDiff, getUserRepos } from './githubService';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reposLoading, setReposLoading] = useState(false);
  const [diffLoading, setDiffLoading] = useState(false);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [repos, setRepos] = useState([]);
  const [diffSummary, setDiffSummary] = useState(null);
  const [form, setForm] = useState({
    prUrl: '',
    diffText: '',
    status: 'pending',
  });

  const isAuthenticated = Boolean(user);

  useEffect(() => {
    const url = new URL(window.location.href);
    const tokenFromQuery = url.searchParams.get('token');

    if (tokenFromQuery) {
      setAuthToken(tokenFromQuery);
      url.searchParams.delete('token');
      window.history.replaceState({}, document.title, `${url.pathname}${url.search}`);
    }

    async function initialize() {
      const token = getAuthToken();
      if (token) {
        try {
          const me = await apiRequest('/api/auth/me');
          setUser(me);
        } catch {
          setAuthToken(null);
          setUser(null);
        }
      }

      try {
        const data = await apiRequest('/api/reviews');
        setReviews(data);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    void initialize();
  }, []);

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
      const data = await apiRequest('/api/reviews');
      setReviews(data);
    } catch (requestError) {
      if (requestError.message === 'UNAUTHORIZED') {
        setUser(null);
        setError('Session expired. Please login again.');
        return;
      }

      setError(requestError.message);
    }
  }

  async function handleLoadRepos() {
    setError('');
    setReposLoading(true);

    try {
      const data = await getUserRepos({ page: 1, perPage: 20 });
      setRepos(data.repos || []);
    } catch (requestError) {
      if (requestError.message === 'UNAUTHORIZED') {
        setAuthToken(null);
        setUser(null);
        setError('Session expired. Please login again.');
        return;
      }

      setError(requestError.message);
    } finally {
      setReposLoading(false);
    }
  }

  async function handleFetchPrDiff() {
    setError('');
    setDiffLoading(true);

    try {
      const data = await getPullRequestDiff(form.prUrl);
      setForm((prev) => ({
        ...prev,
        diffText: data.diffText || '',
      }));
      setDiffSummary(data.parsedDiff || null);
    } catch (requestError) {
      if (requestError.message === 'UNAUTHORIZED') {
        setAuthToken(null);
        setUser(null);
        setError('Session expired. Please login again.');
        return;
      }

      setError(requestError.message);
    } finally {
      setDiffLoading(false);
    }
  }

  function handleLogout() {
    setAuthToken(null);
    setUser(null);
    setError('');
    setRepos([]);
    setDiffSummary(null);
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
          <>
            <button type="button" onClick={handleLoadRepos} disabled={reposLoading}>
              {reposLoading ? 'Loading repos...' : 'Load My Repos'}
            </button>
            <button type="button" onClick={handleLogout}>Logout</button>
          </>
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
          <button
            type="button"
            onClick={handleFetchPrDiff}
            disabled={!isAuthenticated || diffLoading || !form.prUrl.trim()}
          >
            {diffLoading ? 'Fetching diff...' : 'Fetch PR Diff'}
          </button>
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
        {diffSummary && (
          <p>
            Parsed diff: {diffSummary.totalFiles} files, +{diffSummary.totalAdditions} / -
            {diffSummary.totalDeletions}
          </p>
        )}
      </section>

      <section className="panel">
        <h2>My GitHub Repositories</h2>
        <ul>
          {repos.map((repo) => (
            <li key={repo.id}>
              <a href={repo.html_url} target="_blank" rel="noreferrer">{repo.full_name}</a>
            </li>
          ))}
          {repos.length === 0 && <li>No repositories loaded.</li>}
        </ul>
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
