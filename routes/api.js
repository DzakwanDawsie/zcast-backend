'use strict';
const MusicController = require(`../controllers/MusicController`);
const AccountController = require(`../controllers/AccountController`);
const BaseController = require(`../controllers/BaseController`);

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../utils/swagger');

module.exports = function (app) {
  // Swagger docs
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/docs-json', (req, res) => res.json(swaggerSpec));

  // V1 Music endpoints
  app.get('/music/feeds', MusicController.feeds);
  app.get('/music/search', MusicController.search);
  app.get('/music/:videoId/relateds', MusicController.relateds);
  app.get('/music/:videoId/stream-url', MusicController.streamUrl);

  // Account endpoints
  app.get('/account/profile', AccountController.profile);
  app.get('/account/status', AccountController.status);

  // Base endpoints
  app.all('/', BaseController.index);
  app.post('/upload', upload.single('file'), BaseController.upload);
  app.all('/*', BaseController.notFound);
};
