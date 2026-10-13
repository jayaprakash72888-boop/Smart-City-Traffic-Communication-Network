module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const body = req.body || {};
  const user = (body.username || '').toLowerCase();
  const pass = body.password || '';

  if ((user === 'admin' && pass === 'admin123') ||
      (user === 'student' && pass === 'password123') ||
      (user === 'operator' && pass === 'traffic2026')) {
    return res.status(200).json({
      status: 'SUCCESS',
      username: body.username || 'admin',
      role: 'Traffic Operations Controller',
      token: 'cloud_token_' + Date.now()
    });
  }

  return res.status(401).json({
    status: 'ERROR',
    message: 'Invalid credentials. Default is admin / admin123'
  });
};
