import cron from 'node-cron';
import moment from 'moment';
import { ServiceProvider } from './models/serviceProvider';

console.log("🚀 cron.ts has started");

cron.schedule('*/1 * * * *', async () => {
    const timeAgo = moment().subtract(30, 'minutes').toDate();
    console.log("timeAgo", timeAgo)

    const contactsToNotify  = await ServiceProvider.find({
    contactedAt: { $lte: timeAgo },
    notificationSent: false
  });

});