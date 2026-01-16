require('dotenv').config();

// Validate critical environment variables
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined.');
  process.exit(1);
}

if (!process.env.MONGO_URI) {
  console.error('FATAL ERROR: MONGO_URI is not defined.');
  process.exit(1);
}
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`API Key Status: ${process.env.API_KEY ? 'Present (Ends with ' + process.env.API_KEY.slice(-4) + ')' : 'MISSING'}`);
});

// Handle Unhandled Promise Rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
