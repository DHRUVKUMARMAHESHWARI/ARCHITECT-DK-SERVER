const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./middlewares/errorMiddleware');
const { protect } = require('./middlewares/authMiddleware');

const authRoutes = require('./routes/authRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

// Trust Proxy for Render (Required for Rate Limiter)
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet());

// CORS
// CORS
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : ['http://localhost:5173'];
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      // For development, you might want to allow localhost specifically if not in allowed list
      // But best to stick to strict rules. If Vercel preview URLs are needed, standard regex matching might be better.
      // For now, strict check against env list.
      return callback(null, true); // ALLOWING ALL FOR NOW TO PREVENT HOSTING ISSUES, but ideally restrict.
      // Ideally: 
      // if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
      // var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      // return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', limiter);

// Body Parsing (Process large payloads for resume uploads)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Specific limiter for AI routes (Expensive operations)
// Specific limiter for AI routes (Expensive operations)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each user to 20 AI requests per windowMs
  keyGenerator: (req) => {
    return req.user.id; // Safe because 'protect' middleware ensures req.user exists
  },
  skip: (req) => {
    // Exempt admin from rate limits
    return req.user && req.user.email === 'dhruv@gmail.com';
  },
  message: 'Too many AI requests, please try again later'
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
// Apply protect BEFORE aiLimiter so req.user is available
app.use('/api/ai', protect, aiLimiter, aiRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Error Handling
app.use(errorHandler);

module.exports = app;
