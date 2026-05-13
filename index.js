import express from 'express';
import mongoose from 'mongoose';
import { bot } from './bot/bot.js';
import { startPaymentServer } from './backend/server.js';
import dotenv from 'dotenv';
import cron from 'node-cron';
import Project from './backend/models/Project.js';

dotenv.config();

// Connect MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// Start Express server
const app = express();
startPaymentServer(app);

// Cleanup unpaid projects every hour
cron.schedule('0 * * * *', async () => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await Project.deleteMany({
    status: 'pending_payment',
    createdAt: { $lt: cutoff }
  });
  console.log('🧹 Cleaned up unpaid old projects');
});

// Launch Telegram bot
bot.launch().then(() => console.log('🤖 Telegram bot started'));

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
