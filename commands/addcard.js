const { PermissionsBitField } = require('discord.js');
const Card = require('../models/Card');

module.exports = {
    name: 'addcard',
    description: 'Add a new card to the game. (Admin only)',
    aliases: ['add', 'newcard'],
    async execute(message, args) {
        const userId = message.author.id;

        // Check if the user has admin permissions
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.channel.send({
                content: 'You do not have permission to use this command.',
                allowedMentions: { users: [] },
                reply: { messageReference: message.id }
            });
        }

        // Check if the required arguments are provided
        if (args.length < 5) {
            return message.channel.send({
                content: 'Please provide all required fields: `idolName`, `group`, `rarity`, `theme`, `imageLink`.',
                allowedMentions: { users: [] },
                reply: { messageReference: message.id }
            });
        }

        const [idolName, group, rarity, theme, imageLink] = args;

        // Validate the rarity
        const validRarities = ['normal', 'sphere', 'rare', 'event'];
        if (!validRarities.includes(rarity.toLowerCase())) {
            return message.channel.send({
                content: 'Invalid rarity! Use one of the following: `normal`, `sphere`, `rare`, `event`.',
                allowedMentions: { users: [] },
                reply: { messageReference: message.id }
            });
        }

        try {
            // Create a new card instance
            const newCard = new Card({
                idolName,
                group,
                rarity: rarity.toLowerCase(),
                theme,
                image: imageLink,
                cardID: await generateUniqueCardID() // Function to generate a unique card ID
            });

            // Save the card to the database
            await newCard.save();

            return message.channel.send({
                content: `New card added successfully! **Idol Name:** ${idolName}, **Group:** ${group}, **Rarity:** ${rarity}, **Theme:** ${theme}.`,
                allowedMentions: { users: [] },
                reply: { messageReference: message.id }
            });
        } catch (error) {
            return message.channel.send({
                content: `Error adding card: ${error.message}`,
                allowedMentions: { users: [] },
                reply: { messageReference: message.id }
            });
        }
    },
};

// Function to generate a unique card ID
async function generateUniqueCardID() {
    const lastCard = await Card.findOne().sort({ cardID: -1 }); // Find the card with the highest cardID
    return lastCard ? lastCard.cardID + 1 : 1; // Increment the card ID, or start at 1 if no cards exist
}
