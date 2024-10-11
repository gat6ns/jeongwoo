const Card = require('../models/Card');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'album',
    description: 'View multiple cards from a specific group and rarity.',
    async execute(message, args) {
        const groupName = args[0];
        const rarity = args[1];

        if (!groupName || !rarity) {
            return message.reply('Usage: !album groupname rarity');
        }

        const cards = await Card.find({ group: groupName, rarity });

        if (cards.length === 0) {
            return message.reply('No cards found for this group and rarity.');
        }

        const embed = new EmbedBuilder()
            .setTitle(`${groupName} - ${rarity} Cards`)
            .setColor('#0099ff');

        cards.forEach(card => {
            embed.addField(card.idolName, `Card ID: ${card.cardID}\n![Image](${card.image})`, true);
        });

        message.channel.send({ embeds: [embed] });
    },
};
