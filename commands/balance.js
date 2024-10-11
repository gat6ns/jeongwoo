const User = require('../models/User');

module.exports = {
    name: 'balance',
    description: 'Check your token balance.',
    async execute(message) {
        const user = await User.findOne({ userId: message.author.id }) || new User({ userId: message.author.id });

        message.channel.send(`${message.author.username}, you have ${user.tokens} tokens.`);
    },
};
