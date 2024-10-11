const User = require('../models/User');
const Card = require('../models/Card');

module.exports = {
    name: 'give',
    description: 'Give a card to another user.',
    aliases: ['trade', 'send'],
    async execute(message, args) {
        const userId = message.author.id;
        const recipientMention = message.mentions.users.first();

        // Check if the recipient is mentioned
        if (!recipientMention) {
            return message.channel.send({
                content: 'Please mention a user to give a card to.',
                allowedMentions: { users: [] },
                reply: { messageReference: message.id }
            });
        }

        const recipientId = recipientMention.id;
        const cardId = args[1];

        // Check if the card ID is provided
        if (!cardId) {
            return message.channel.send({
                content: 'Please provide a card ID to give.',
                allowedMentions: { users: [] },
                reply: { messageReference: message.id }
            });
        }

        const sender = await User.findOne({ userId });
        const recipient = await User.findOne({ userId: recipientId });

        // Check if both users are registered
        if (!sender) {
            return message.channel.send({
                content: 'You need to register first by using the !start command.',
                allowedMentions: { users: [] },
                reply: { messageReference: message.id }
            });
        }

        if (!recipient) {
            return message.channel.send({
                content: `${recipientMention} needs to register first by using the !start command.`,
                allowedMentions: { users: [] },
                reply: { messageReference: message.id }
            });
        }

        // Check if the sender has the specified card
        const cardIndex = sender.cards.indexOf(cardId);
        if (cardIndex === -1) {
            return message.channel.send({
                content: 'You do not have that card in your inventory.',
                allowedMentions: { users: [] },
                reply: { messageReference: message.id }
            });
        }

        // Remove the card from sender's inventory
        const [transferredCard] = sender.cards.splice(cardIndex, 1);
        await sender.save();

        // Add the card to recipient's inventory
        recipient.cards.push(transferredCard);
        await recipient.save();

        // Send confirmation message to both users
        await message.channel.send({
            content: `You have given **${transferredCard.idolName}** to ${recipientMention}.`,
            allowedMentions: { users: [] },
            reply: { messageReference: message.id }
        });

        // Removed the DM to the recipient
    },
};
