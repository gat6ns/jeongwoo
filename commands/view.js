const { EmbedBuilder } = require('discord.js');
const Card = require('../models/Card'); // Import your Card model
const User = require('../models/User'); // Import the User model

module.exports = {
    name: 'view',
    description: 'View details of a specific card by ID',
    async execute(message, args) {
        // Check if card ID is provided
        const cardId = args[0]; // Assuming the card ID is the first argument

        if (!cardId) {
            return message.channel.send('Please provide a card ID to view.');
        }

        try {
            // Find the user in the database
            const user = await User.findOne({ userId: message.author.id });

            // Check if the user has any cards
            if (!user || !user.cards || !user.cards.includes(cardId)) {
                return message.channel.send('You do not own this card or you have no cards in your inventory.');
            }

            // Find the card with the given card ID in the database
            const card = await Card.findOne({ cardID: cardId });

            if (!card) {
                return message.channel.send('Card not found.');
            }

            // Create an embed message with card details
            const embed = new EmbedBuilder()
                .setColor(15262921) // Use the hex color code
                // .setTitle(card.idolName || 'Unknown Idol') // Fallback if idol name is not available
                .setAuthor({ name: '🎴 View Card' })
                .setDescription(`**Name:** ${card.idolName}\n **Group:** ${card.group}\n**Theme:** ${card.theme}\n**Rarity:** ${card.rarity} \n**CardID:** ${card.cardID}`)
                .setImage(card.image) // Set the card image
                // .addFields(
                //     { name: 'Card ID', value: card.cardID.toString(), inline: true } // Convert cardID to string for consistency
                // );

            // Reply with the embed message
            await message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching card:', error);
            return message.channel.send('An error occurred while fetching the card details. Please try again later.');
        }
    },
};
