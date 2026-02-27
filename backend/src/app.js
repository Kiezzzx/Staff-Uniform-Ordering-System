const express = require('express');
const cors = require('cors');

const { initDatabase } = require('./db/db');
const requestRoutes = require('./routes/requestRoutes');
const importRoutes = require('./routes/importRoutes');
const staffRoutes = require('./routes/staffRoutes');
const uniformItemRoutes = require('./routes/uniformItemRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const { handleNotFound, errorHandler } = require('./errors/errorMiddleware');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/requests', requestRoutes);
app.use('/api/imports', importRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/uniform-items', uniformItemRoutes);
app.use('/api/settings', settingsRoutes);

app.use(handleNotFound);
app.use(errorHandler);

initDatabase()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[server] Port ${PORT} is already in use. Set a different PORT or stop the existing process.`);
        process.exit(1);
      }

      console.error('[server] Failed to start:', err.message);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('[sqlite] schema init failed:', err.message);
    process.exit(1);
  });
