const User = require('../models/User');

module.exports = {
    name: 'weekly',
    description: 'Claim your weekly rewards.',
    cooldown: 604800000, // 7 days in milliseconds
    async execute(message) {
        const userId = message.author.id;
        const user = await User.findOne({ userId });

        // Check if the user is registered
        if (!user) {
            return message.reply('You need to register first by using the !start command.');
        }

        const now = Date.now();
        const lastClaimed = user.lastWeeklyClaim || 0;
        if (now - lastClaimed < this.cooldown) {
            const remaining = Math.ceil((this.cooldown - (now - lastClaimed)) / 1000);
            return message.reply(`You must wait ${remaining} seconds before claiming your weekly rewards again.`);
        }

        // Grant rewards
        user.cards.push(...getRandomCards(3)); // Function to get random cards
        user.tokens += 100; // Grant tokens
        user.lastWeeklyClaim = now; // Update last claimed time
        await user.save();

        message.channel.send(`You have claimed your weekly rewards: 3 cards and 100 tokens!`);
    },
};

// Function to get 3 random cards (replace with actual card retrieval logic)
function getRandomCards(num) {
    // Logic to retrieve random card IDs
    return [3, 4, 5]; // Replace with actual card logic
}
