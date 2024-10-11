const { EmbedBuilder } = require('discord.js');
const User = require('../models/User');
const Card = require('../models/Card'); // Ensure you import the Card model

module.exports = {
    name: 'profile',
    description: 'View your profile.',
    async execute(message) {
        const user = await User.findOne({ userId: message.author.id }) || new User({ userId: message.author.id });

        // Fetch the favorite card details if it exists
        let favoriteCardImageUrl;
        if (user.favoriteCard) {
            const favoriteCard = await Card.findOne({ cardId: user.favoriteCard }); // Adjust this according to your card ID field
            if (favoriteCard) {
                favoriteCardImageUrl = favoriteCard.image; // Adjust to the correct field name for the image URL
            }
        }

        const embed = new EmbedBuilder()
            .setTitle(`${message.author.username}'s Profile`)
            .addFields([
                { name: 'Tokens', value: `${user.tokens}`, inline: true },
                { name: 'Cards', value: `${user.cards.length}`, inline: true },
                { name: 'Date Joined', value: `${user.dateJoined.toDateString()}`, inline: true },
                { name: 'Favorite Card', value: `${user.favoriteCard || 'None'}`, inline: true }
            ])
            .setColor('#ffffff');

        // Set thumbnail to the favorite card's image URL if it exists
        if (favoriteCardImageUrl) {
            embed.setThumbnail(favoriteCardImageUrl); // Use the URL from the card data
        }

        message.channel.send({ embeds: [embed] });
    },
};
