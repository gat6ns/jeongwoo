const Card = require("../models/Card");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const CARDS_PER_PAGE = 9; // Number of cards per embed page

const rarityEmojis = {
    normal: "<:normal:1294298974638964746>", // Unicode emoji for normal
    sphere: "<:sphere:1294299007694143658>", // Unicode emoji for sphere
    rare: "<:rare:1294298991760248903>", // Unicode emoji for rare
    event: "<:card:1070738500351176774>", // Unicode emoji for event
};

module.exports = {
    name: "cardlist",
    description: "Show a list of all cards in the game.",
    aliases: ["cl"],
    async execute(message) {
        try {
            // Fetch all cards from the database
            const cards = await Card.find({});

            // Check if there are cards available
            if (cards.length === 0) {
                return message.channel.send({
                    content: "No cards available in the game.",
                    allowedMentions: { users: [] },
                    reply: { messageReference: message.id },
                });
            }

            let currentPage = 0; // Track the current page

            // Create the initial message
            const msg = await sendPage(message, currentPage, cards);

            // Create buttons for pagination
            const row = createButtonRow(currentPage, Math.ceil(cards.length / CARDS_PER_PAGE));
            await msg.edit({ components: [row] });

            // Create a button interaction collector
            const filter = (interaction) => interaction.user.id === message.author.id;
            const collector = msg.createMessageComponentCollector({ filter, time: 60000 }); // Collect for 60 seconds

            collector.on("collect", async (interaction) => {
                if (interaction.customId === "next") {
                    // Next page
                    if (currentPage < Math.ceil(cards.length / CARDS_PER_PAGE) - 1) {
                        currentPage++;
                        await sendPage(message, currentPage, cards, msg);
                    }
                } else if (interaction.customId === "prev") {
                    // Previous page
                    if (currentPage > 0) {
                        currentPage--;
                        await sendPage(message, currentPage, cards, msg);
                    }
                }

                // Update the buttons after each interaction
                const newRow = createButtonRow(currentPage, Math.ceil(cards.length / CARDS_PER_PAGE));
                await msg.edit({ components: [newRow] });

                await interaction.deferUpdate(); // Acknowledge the interaction
            });

            collector.on("end", () => {
                msg.edit({ components: [] }); // Remove buttons after the collector ends
            });
        } catch (error) {
            console.error(error);
            await message.channel.send({
                content: `Error: ${error.message}`,
                allowedMentions: { users: [] },
                reply: { messageReference: message.id },
            });
        }
    },
};

// Helper function to create the button row
function createButtonRow(currentPage, pageCount) {
    const row = new ActionRowBuilder();

    // Previous button
    const prevButton = new ButtonBuilder()
        .setCustomId("prev")
        .setLabel("Previous")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === 0); // Disable if on the first page

    // Next button
    const nextButton = new ButtonBuilder()
        .setCustomId("next")
        .setLabel("Next")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === pageCount - 1); // Disable if on the last page

    row.addComponents(prevButton, nextButton);
    return row;
}

// Helper function to send the current page of cards
async function sendPage(message, page, cards, previousMessage) {
    const embed = new EmbedBuilder()
        .setColor(15262921)
        .setTitle("📜 Card List")
        .setDescription("Here are the cards available in the game:");

    // Get the cards for the current page
    const startIndex = page * CARDS_PER_PAGE;
    const cardsToDisplay = cards.slice(startIndex, startIndex + CARDS_PER_PAGE);

    // Add cards to the embed
    cardsToDisplay.forEach((card) => {
        embed.addFields({
            name: `${rarityEmojis[card.rarity]} ${card.idolName}`,
            value: `<:card:1070738500351176774> ${card.group}\n🎧${card.theme}`,
            inline: true, // Use inline for better layout
        });
    });

    // Add footer with pagination info
    embed.setFooter({ text: `Page ${page + 1} of ${Math.ceil(cards.length / CARDS_PER_PAGE)}` });

    if (previousMessage) {
        // Edit the existing message
        return previousMessage.edit({ embeds: [embed] });
    } else {
        // Send the new message if no previous message exists
        return await message.channel.send({ embeds: [embed], allowedMentions: { users: [] }, reply: { messageReference: message.id } });
    }
}
