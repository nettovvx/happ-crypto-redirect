const { Router } = require('express');

const { asyncHandler } = require('../utils/asyncHandler');
const { parseMiniappUrl } = require('../utils/miniappParser');
const { getEncryptedUrlForToken, getMiniappResult } = require('../services/redirectService');

const router = Router();

router.get(
  '/miniapp/redirect.html',
  asyncHandler(async (req, res) => {
    const token = parseMiniappUrl(req.query.url);
    res.locals.token = token;

    const encryptedUrl = await getEncryptedUrlForToken(token, req.requestId);
    const result = getMiniappResult(encryptedUrl);

    if (result.type === 'redirect') {
      res.redirect(result.status, result.location);
      return;
    }

    res.status(result.status).type('html').send(result.body);
  })
);

module.exports = router;
