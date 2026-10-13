module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  res.status(200).json({
    status: 'UP',
    message: 'Smart City Traffic Cloud Server Active',
    nodes: 8,
    timestamp: Date.now()
  });
};
