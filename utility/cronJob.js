const cron = require('node-cron');
const { offerExpired } = require('./offerExpired');

// Define and export the cron job
const expiredOffersCronJob = {
    start: () => {
        cron.schedule('*/60 * * * *', async () => { 
            try {
                console.log('Running cron job to delete expired offers and update prices...');
                await offerExpired();
            } catch (error) {
                console.error('Error in cron job:', error);
            }
        }, {
            timezone: 'Asia/Kolkata'
        });
    }
};

module.exports = expiredOffersCronJob;
