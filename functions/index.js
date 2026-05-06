const admin = require('firebase-admin');
const { onRequest } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');

if (!admin.apps.length) {
  admin.initializeApp();
}

function getConfiguredPasscode() {
  const value = process.env.ADMIN_PASSCODE;
  return typeof value === 'string' ? value.trim() : '';
}

exports.verifyAdminPasscode = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method-not-allowed' });
    return;
  }

  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'unauthenticated' });
    return;
  }

  const submittedPasscode = String(req.body?.passcode || '');
  const expectedPasscode = getConfiguredPasscode();
  if (!expectedPasscode) {
    logger.error('verifyAdminPasscode misconfigured: ADMIN_PASSCODE is empty.');
    res.status(500).json({ error: 'verification-unavailable' });
    return;
  }

  try {
    const token = authHeader.slice('Bearer '.length).trim();
    const decoded = await admin.auth().verifyIdToken(token, true);

    if (!decoded?.uid) {
      res.status(401).json({ error: 'unauthenticated' });
      return;
    }

    if (submittedPasscode !== expectedPasscode) {
      res.status(403).json({ error: 'permission-denied' });
      return;
    }

    const user = await admin.auth().getUser(decoded.uid);
    const existingClaims = user.customClaims || {};
    await admin.auth().setCustomUserClaims(decoded.uid, { ...existingClaims, admin: true });
    res.status(200).json({ ok: true });
  } catch (error) {
    logger.error('verifyAdminPasscode failed', { message: error instanceof Error ? error.message : 'unknown' });
    res.status(401).json({ error: 'unauthenticated' });
  }
});
