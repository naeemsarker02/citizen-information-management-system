const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./docs/swagger');
const notFound = require('./middlewares/not-found');
const errorHandler = require('./middlewares/error-handler');
const authRoutes = require('./modules/auth/auth.routes');
const recordsRoutes = require('./modules/records/records.routes');
const correctionRoutes = require('./modules/correction-requests/correction.routes');
const correctionOfficerRoutes = require('./modules/correction-requests/correction.officer.routes');

const app = express();

// Helmet's default CSP blocks Swagger UI's inline scripts. Since /api-docs
// serves only static documentation (no user data), it is safe to bypass
// helmet on this specific route.
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'CIMS API Docs',
    swaggerOptions: {
      persistAuthorization: true, // keep token across page reloads
    },
  })
);

app.get('/docs', (_req, res) => res.redirect('/api-docs'));
app.get('/', (_req, res) => res.redirect('/api-docs'));

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

app.get('/api/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'CIMS API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/citizen', recordsRoutes);
app.use('/api/citizen', correctionRoutes);
app.use('/api/officer', correctionOfficerRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;