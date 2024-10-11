const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const Market = require("../models/Market");
const User = require("../models/User");

const rarityEmojis = {
    normal: "<:normal:1294298974638964746>",
    sphere: "<:sphere:1294299007694143658>",
    rare: "<:rare:1294298991760248903>",
    event: "<:card:1070738500351176774>",
};

const MAX_FIELDS = 9; // Maximum number of fields per embed

module.exports = {
    name: "market",
    description: "View all cards available in the market.",
    async execute(message, args) {
        // Initialize filters
        const filters = {};

        // Check if an argument is provided for filtering
        if (args.length > 0) {
            const filterValue = args[0];

            // Check if the argument matches known rarity filters
            if (filterValue === "n") {
                filters.rarity = "normal";
            } else if (filterValue === "s") {
                filters.rarity = "sphere";
            } else if (filterValue === "r") {
                filters.rarity = "rare";
            } else if (filterValue === "e") {
                filters.rarity = "event";
            } else {
                // If no rarity, treat the value as idol name, theme, or group
                filters.$or = [
                    { idolName: { $regex: filterValue, $options: 'i' } }, // Filter by idol name
                    { theme: { $regex: filterValue, $options: 'i' } },  // Filter by theme
                    { group: { $regex: filterValue, $options: 'i' } }   // Filter by group
                ];
            }
        }

        // Fetch market listings and apply filters
        let marketListings = await Market.find(filters).exec();

        if (marketListings.length === 0) {
            return message.channel.send("There are no cards available in the market right now.");
        }

        let currentPage = 0;

        const createEmbed = (page) => {
            const embed = new EmbedBuilder()
                .setTitle("🛒 Market")
                .setDescription("Here are the cards currently for sale:")
                .setColor("#FFA500");

            const start = page * MAX_FIELDS; 
            const end = Math.min(start + MAX_FIELDS, marketListings.length); 
            const listingsToShow = marketListings.slice(start, end);

            listingsToShow.forEach((listing) => {
                embed.addFields({
                    name: `${rarityEmojis[listing.rarity]} **${listing.idolName}**`,
                    value: `> <:card:1070738500351176774> **Group:** ${listing.group}\n> 🎧 **Theme:** ${listing.theme}\n> 💰 **Price:** ${listing.price} tokens\n> **Seller:** <@${listing.sellerId}>`,
                    inline: true
                });
            });

            embed.setFooter({ text: `Page ${page + 1} of ${Math.ceil(marketListings.length / MAX_FIELDS)}` });
            return embed;
        };

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('previous')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === 0), 
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage >= Math.ceil(marketListings.length / MAX_FIELDS) - 1) 
            );

        const initialEmbed = createEmbed(currentPage);
        const msg = await message.channel.send({ embeds: [initialEmbed], components: [row] });

        const filter = (interaction) => interaction.user.id === message.author.id;

        const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'next') {
                currentPage++;
            } else if (interaction.customId === 'previous') {
                currentPage--;
            }

            // Log current page for debugging
            console.log(`Current Page: ${currentPage}`);

            // Create new embed and update buttons
            const newEmbed = createEmbed(currentPage);

            // Update button states
            row.components[0].setDisabled(currentPage === 0); 
            row.components[1].setDisabled(currentPage >= Math.ceil(marketListings.length / MAX_FIELDS) - 1);

            // Single update call
            await interaction.update({ embeds: [newEmbed], components: [row] });
        });

        collector.on('end', () => {
            row.components.forEach(button => button.setDisabled(true)); // Disable all buttons after the collector ends
            msg.edit({ components: [row] });
        });
    },
};
