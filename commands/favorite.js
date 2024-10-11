const { EmbedBuilder } = require('discord.js');
const User = require('../models/User');
const Card = require('../models/Card');

module.exports = {
    name: 'favorite',
    description: 'Set your favorite card.',
    async execute(message, args) {
        const userId = message.author.id;
        const user = await User.findOne({ userId });

        // Check if the user is registered
        if (!user) {
            return message.reply('You need to register first by using the !start command.');
        }

        // Check if card ID is provided
        if (!args[0]) {
            return message.reply('Please provide a card ID to set as your favorite.');
        }

        const cardId = args[0];
        const image = args[0];

        // Check if the user owns the card
        if (!user.cards.includes(cardId)) {
            return message.reply('You do not own this card, so you cannot set it as your favorite.');
        }

        // Optionally, retrieve the card details to send a confirmation message
        const favoriteCard = await Card.findOne({ cardID: cardId });
        
        // Set the favorite card
        user.favoriteCardImageUrl = favoriteCard.image;
        user.favoriteCard = cardId;
        await user.save();

        const embed = new EmbedBuilder()
            .setTitle('Favorite Card Set!')
            .setDescription(`Your favorite card has been set to: ${favoriteCard.idolName}`)
            .setThumbnail(favoriteCard.image) // Assuming the card image URL is stored in the image field
            .setColor('#0099ff');

        message.channel.send({ embeds: [embed] });
    },
};
