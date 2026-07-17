require('dotenv').config();
const createApp = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/ems');
    const app = createApp();
    app.listen(PORT, () => {
      console.log(`EMS backend listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
