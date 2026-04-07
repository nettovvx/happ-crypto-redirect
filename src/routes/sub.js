const { Router } = require('express');

const { asyncHandler } = require('../utils/asyncHandler');
const { getEncryptedUrlForToken, getSubRedirectLocation } = require('../services/redirectService');

const router = Router();

router.get(
  '/api/sub/:token',
  asyncHandler(async (req, res) => {
    const { token } = req.params;
    res.locals.token = token;

    const encryptedUrl = await getEncryptedUrlForToken(token, req.requestId);
    res.redirect(307, getSubRedirectLocation(encryptedUrl));
  })
);

module.exports = router;
