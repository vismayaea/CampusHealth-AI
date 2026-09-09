const express = require('express');
const path = require('path');
const dns = require('dns');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const dotenvResult = require('dotenv').config({ path: path.resolve(__dirname, '.env') });
if (dotenvResult.error) {
  console.error('Failed to load .env file:', dotenvResult.error.message);
}

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200', 10)
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const maskMongoUri = (uri = '') => uri.replace(
  /(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@/i,
  (_, protocol, username) => `${protocol}${username}:****@`
);

const logMongoConnectionError = (error) => {
  console.error('MongoDB connection failed');
  console.error('MongoDB error name:', error.name);
  console.error('MongoDB error message:', error.message);
  if (error.code) console.error('MongoDB error code:', error.code);
  if (error.codeName) console.error('MongoDB error codeName:', error.codeName);
  if (error.syscall) console.error('MongoDB error syscall:', error.syscall);
  if (error.hostname) console.error('MongoDB error hostname:', error.hostname);
  if (error.reason) console.error('MongoDB topology reason:', error.reason);
  if (process.env.NODE_ENV !== 'production' && error.stack) {
    console.error('MongoDB error stack:', error.stack);
  }
};

const configureMongoDns = (uri) => {
  const configuredServers = (process.env.MONGODB_DNS_SERVERS || '')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);

  if (!uri.startsWith('mongodb+srv://') || configuredServers.length === 0) {
    return;
  }

  dns.setServers(configuredServers);
  console.log('MongoDB DNS servers:', configuredServers.join(', '));
};

const connectDatabase = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add a MongoDB connection string to .env before starting the server.');
  }

  console.log('MongoDB URI:', maskMongoUri(uri));
  console.log('MongoDB URI scheme:', uri.startsWith('mongodb+srv://') ? 'mongodb+srv' : 'mongodb');
  configureMongoDns(uri);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || '10000', 10),
      connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT_MS || '10000', 10),
      autoIndex: true
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    logMongoConnectionError(err);
    throw err;
  }
};

app.use('/api/auth', require('./routes/auth'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/counselors', require('./routes/counselors'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/forum', require('./routes/forum'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/screening', require('./routes/screening'));
app.use('/api/surveys', require('./routes/surveys'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/settings', require('./routes/settings'));

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: dbState === 1 ? 'connected' : 'disconnected'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

connectDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch(() => {
    console.error('Server startup aborted because MongoDB connection could not be established.');
    process.exit(1);
  });
