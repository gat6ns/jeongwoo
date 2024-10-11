const User = require('../models/User');

module.exports = {
    name: 'start',
    description: 'Register yourself to start using the bot.',
    async execute(message) {
        const userId = message.author.id;

        // Check if the user is already registered
        let user = await User.findOne({ userId });
        if (user) {
            return message.reply('You are already registered! You can start playing the game.');
        }

        // Register the user
        user = new User({
            userId,
            cards: [],
            tokens: 0,
            dateJoined: Date.now(),
            lastDailyClaim: 0,
            lastWeeklyClaim: 0,
            lastDrop: 0,
            favoriteCard: null,
        });

        await user.save();

        message.channel.send(`Welcome! You are now registered. You can start playing by using commands like !daily, !weekly, !drop, and more.`);
    },
};
