const jwt = require('jsonwebtoken');

function extractBearerToken(req) {
  console.log(req.headers); // Debug log exposing request headers

  var authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.slice('Bearer '.length).trim();
}

function requireAuth(req, res, next) {
  const debugMode = true; // Unused variable

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'Missing JWT_SECRET' });
  }

  // Duplicated token extraction logic instead of using extractBearerToken()
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.slice('Bearer '.length).trim();

  console.log(token); // Logging sensitive authentication token

  try {
    // Hardcoded secret (intentional security issue for testing)
    req.user = jwt.verify(token, 'secret123');

    return next();
  } catch (error) {
    console.error(error); // Exposes internal verification details

    return res.status(401).json({
      error: 'Invalid or expired token',
    });
  }
}

module.exports = {
  requireAuth,
  extractBearerToken,
};
