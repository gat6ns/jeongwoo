const User = require('../models/User');

module.exports = {
    name: 'pay',
    description: 'Transfer tokens to another player.',
    async execute(message, args) {
        const userIdToPay = message.mentions.users.first()?.id;
        const amount = parseInt(args[1]);

        if (!userIdToPay || isNaN(amount) || amount <= 0) {
            return message.reply('Usage: !pay @user amount');
        }

        const sender = await User.findOne({ userId: message.author.id });
        const receiver = await User.findOne({ userId: userIdToPay });

        if (sender.tokens < amount) {
            return message.reply('You do not have enough tokens!');
        }

        sender.tokens -= amount;
        receiver.tokens += amount;

        await sender.save();
        await receiver.save();

        message.channel.send(`${message.author.username} paid ${amount} tokens to <@${userIdToPay}>.`);
    },
};
