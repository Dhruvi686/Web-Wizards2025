const adminAuth = (req, res, next) => {
  const adminSecret = req.headers['x-admin-secret'] || req.headers['authorization'];

  if (!adminSecret) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Admin secret required. Provide X-Admin-Secret header.'
    });
  }

  // Handle both direct secret and Bearer token format
  const providedSecret = adminSecret.startsWith('Bearer ')
    ? adminSecret.slice(7)
    : adminSecret;

  if (providedSecret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid admin secret'
    });
  }

  // Add admin flag to request for use in controllers
  req.isAdmin = true;
  next();
};

const optionalAdminAuth = (req, res, next) => {
  const adminSecret = req.headers['x-admin-secret'] || req.headers['authorization'];

  if (adminSecret) {
    const providedSecret = adminSecret.startsWith('Bearer ')
      ? adminSecret.slice(7)
      : adminSecret;

    req.isAdmin = providedSecret === process.env.ADMIN_SECRET;
  } else {
    req.isAdmin = false;
  }

  next();
};

module.exports = {
  adminAuth,
  optionalAdminAuth
};
