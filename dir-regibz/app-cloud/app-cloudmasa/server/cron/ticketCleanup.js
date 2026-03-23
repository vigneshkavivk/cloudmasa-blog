import SupportTicket from '../models/SupportTicket.js';
import { CronJob } from 'cron';

// Function to clean up old closed tickets
const cleanupOldTickets = async () => {
  try {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24); // 24 hours ago
    
    // Find and delete tickets that are closed and were updated more than 24 hours ago
    const result = await SupportTicket.deleteMany({
      status: 'Closed',
      updatedAt: { $lt: cutoffTime }
    });
    
    console.log(`✅ Cleaned up ${result.deletedCount} old closed tickets at ${new Date().toLocaleString()}`);
  } catch (err) {
    console.error('❌ Error cleaning up old tickets:', err);
  }
};

// Schedule the cleanup to run every hour (you can adjust the frequency)
// This runs every hour at the top of the hour
const job = new CronJob('0 * * * *', cleanupOldTickets);

export default job;
