const { Router } = require('express');

const config = require('../config');

const router = Router();

router.get('/debug', (req, res) => {
  res.json({
    ok: true,
    requestId: req.requestId,
    mode: config.miniappResultMode,
    now: new Date().toISOString(),
  });
});

module.exports = router;
