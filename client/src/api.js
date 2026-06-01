const TOKEN_KEY = 'authToken';

function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setAuthToken(token) {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }

  localStorage.setItem(TOKEN_KEY, token);
}

async function apiRequest(path, options = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', ['Bearer', token].join(' '));
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    setAuthToken(null);
    throw new Error('UNAUTHORIZED');
  }

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export { TOKEN_KEY, getAuthToken, setAuthToken, apiRequest };
