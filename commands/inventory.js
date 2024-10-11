const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const User = require('../models/User');
const Card = require('../models/Card');

const rarityEmojis = {
    normal: '<:normal:1294298974638964746>', // Unicode emoji for normal
    sphere: '<:sphere:1294299007694143658>', // Unicode emoji for sphere
    rare: '<:rare:1294298991760248903>', // Unicode emoji for rare
    event: '<:card:1070738500351176774>', // Unicode emoji for event
};

const rarityFilters = {
    n: 'normal',
    s: 'sphere',
    r: 'rare',
    e: 'event',
};

module.exports = {
    name: 'inv',
    description: 'View your obtained cards with optional filters.',
    aliases: ['inv', 'i'],
    async execute(message, args) {
        const user = await User.findOne({ userId: message.author.id }) || new User({ userId: message.author.id });

        // Check if user has any cards
        if (!user.cards || user.cards.length === 0) {
            return message.channel.send(`You have no cards in your inventory.`);
        }

        // Get all cards by their IDs
        const fetchedCards = await Promise.all(user.cards.map(cardId => Card.findOne({ cardID: cardId })));

        // Filter out null values (for any cards that weren't found)
        const validCards = fetchedCards.filter(card => card !== null);

        // Check if validCards has any results
        if (validCards.length === 0) {
            return message.channel.send(`No cards found in your inventory.`);
        }

        // If no arguments are provided, show the entire inventory
        let filteredCards = validCards;
        const filter = args[0]?.toLowerCase();

        if (filter) {
            if (rarityFilters[filter]) {
                // Filter by rarity
                const selectedRarity = rarityFilters[filter];
                filteredCards = validCards.filter(card => card.rarity === selectedRarity);
            } else {
                // Filter by group or idol name
                filteredCards = validCards.filter(card =>
                    card.group.toLowerCase().includes(filter) || card.idolName.toLowerCase().includes(filter)
                );
            }
        }

        // Check if filteredCards has any results
        if (filteredCards.length === 0) {
            return message.channel.send(`No cards found with the applied filters.`);
        }

        // Adjust cards per page based on how many fields you want to fit
        const maxFields = 25; // Max fields allowed in an embed
        const cardsPerPage = Math.floor(maxFields / 3); // 3 fields per card (name, value, inline)

        const totalPages = Math.ceil(filteredCards.length / cardsPerPage);
        let currentPage = 0;

        // Function to generate the embed for the current page
        const generateEmbed = async (page) => {
            const embed = new EmbedBuilder()
                .setTitle(`🎴 ${message.author.username}'s Inventory`)
                .setColor('#ffffff')
                .setDescription(`Total Cards: ${filteredCards.length}`);

            const startIndex = page * cardsPerPage;
            const endIndex = Math.min(startIndex + cardsPerPage, filteredCards.length);

            for (let i = startIndex; i < endIndex; i++) {
                const card = filteredCards[i];
                if (card) {
                    embed.addFields({
                        name: `${rarityEmojis[card.rarity]} ${card.idolName} (${card.rarity})`,
                        value: `> **Group:** ${card.group}\n> **Theme:** ${card.theme}\n> **Card ID:** ${card.cardID}`,
                        inline: true,
                    });
                }
            }

            // Add footer with current page and total pages
            embed.setFooter({ text: `Page ${page + 1} of ${totalPages}` });

            return embed;
        };

        // Create buttons for pagination
        const createRow = (currentPage) => {
            return new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === 0),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === totalPages - 1)
                );
        };

        // Send the initial message
        const msg = await message.channel.send({
            embeds: [await generateEmbed(currentPage)],
            components: [createRow(currentPage)],
        });

        // Create a collector for button interactions
        const filterInteraction = (interaction) => interaction.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({ filter: filterInteraction, time: 60000 }); // Collect for 60 seconds

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'prev' && currentPage > 0) {
                currentPage--;
            } else if (interaction.customId === 'next' && currentPage < totalPages - 1) {
                currentPage++;
            }

            // Update the embed and button states
            const newEmbed = await generateEmbed(currentPage);
            await interaction.update({
                embeds: [newEmbed],
                components: [createRow(currentPage)],
            });
        });

        collector.on('end', () => {
            // Disable buttons after the collector ends
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId('prev').setLabel('Previous').setStyle(ButtonStyle.Primary).setDisabled(true),
                    new ButtonBuilder().setCustomId('next').setLabel('Next').setStyle(ButtonStyle.Primary).setDisabled(true)
                );
            msg.edit({ components: [disabledRow] });
        });
    },
};
