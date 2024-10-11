const User = require("../models/User");
const Card = require("../models/Card");
const { randomInt } = require("crypto");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

const rarityEmojis = {
    normal: "<:normal:1294298974638964746>", // Unicode emoji for normal
    sphere: "<:sphere:1294299007694143658>", // Unicode emoji for sphere
    rare: "<:rare:1294298991760248903>", // Unicode emoji for rare
    event: "<:card:1070738500351176774>", // Unicode emoji for event
};

let isExecuting = false; // Flag to prevent duplicate executions

module.exports = {
    name: "drop",
    description: "Drop 3 random cards to pick one.",
    aliases: ["d", "dr"],
    cooldown: 15000, // 15 seconds in milliseconds
    async execute(message) {
        if (isExecuting) return; // Prevent re-entry
        isExecuting = true; // Set to true when the command starts

        const userId = message.author.id;
        const user = await User.findOne({ userId });

        // Check if the user is registered
        if (!user) {
            isExecuting = false; // Reset the flag
            return message.channel.send({
                content:
                    "You need to register first by using the !start command.",
                allowedMentions: { users: [] },
                reply: { messageReference: message.id },
            });
        }

        const now = Date.now();

        // Check cooldown
        if (user.lastDrop && now - user.lastDrop < this.cooldown) {
            const remaining = Math.ceil(
                (this.cooldown - (now - user.lastDrop)) / 1000,
            );
            isExecuting = false; // Reset the flag
            return message.channel.send({
                content: `You must wait ${remaining} seconds before dropping cards again.`,
                allowedMentions: { users: [] },
                reply: { messageReference: message.id },
            });
        }

        try {
            // Get 3 random cards
            const cards = await getRandomCards(3);

            // Display cards in an embed message for the user to pick
            const embed = new EmbedBuilder()
                .setColor(15262921)
                .setAuthor({ name: "🎴 Drop Card" })
                .setDescription(`<@${userId}> has dropped 3 cards! Pick one group to claim a card:`)
                // .setImage(
                //     "https://media.discordapp.net/attachments/1070736336237101136/1294168296718991491/card.png?ex=670a07a6&is=6708b626&hm=82ada2e3de5cc9d2df285ef1db36eb265a769eb1145570acb507e161a231c3ef&=&format=webp&quality=lossless&width=614&height=135",
                // )
                .setFooter({
                    text: "You only have 20 seconds to claim.",
                });

            // Add card details inline
            cards.forEach((card, index) => {
                embed.addFields({
                    name: `${rarityEmojis[card.rarity]} ${card.rarity.toUpperCase()}`,
                    value: `<:card:1070738500351176774> ${card.group}\n🎧 ${card.theme}`,
                    inline: true,
                });
            });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("card_1")
                    .setLabel(cards[0].group) // Group name for Card 1
                    .setStyle(ButtonStyle.Secondary), // Set all buttons to Primary style
                new ButtonBuilder()
                    .setCustomId("card_2")
                    .setLabel(cards[1].group) // Group name for Card 2
                    .setStyle(ButtonStyle.Secondary), // Set all buttons to Primary style
                new ButtonBuilder()
                    .setCustomId("card_3")
                    .setLabel(cards[2].group) // Group name for Card 3
                    .setStyle(ButtonStyle.Secondary), // Set all buttons to Primary style
            );

            const msg = await message.channel.send({
                embeds: [embed],
                components: [row],
                allowedMentions: { users: [] },
                reply: { messageReference: message.id },
            });

            // Store last drop time
            user.lastDrop = now;
            await user.save();

            let claimed = false; // Flag to track if the user has claimed a card

            // Button collector to handle user's choice
            const filter = (interaction) => {
                return interaction.user.id === message.author.id && !claimed; // Only allow the command user to interact if they haven't claimed yet
            };

            const collector = msg.createMessageComponentCollector({
                filter,
                time: 20000,
            }); // Collect for 20 seconds

            collector.on("collect", async (interaction) => {
                if (claimed) return; // Prevent processing if already claimed
                claimed = true; // Set to true upon first claim

                await interaction.deferUpdate(); // Acknowledge the button interaction immediately

                const index = parseInt(interaction.customId.split("_")[1]) - 1; // Extract the card index
                const chosenCard = cards[index];

                // Add the chosen card to the user's inventory
                user.cards.push(chosenCard.cardID);
                await user.save();

                // Create a confirmation embed visible to everyone
                const confirmationEmbed = new EmbedBuilder()
                    .setColor("#ffffff") // Green color for confirmation
                    .setAuthor({ name: "Card Claimed!" })
                    .setDescription(
                        `<:card:1070738500351176774> ${chosenCard.idolName} (${chosenCard.theme} ${rarityEmojis[chosenCard.rarity]})\n◽ ${chosenCard.group} : ${chosenCard.cardID}\n◽ Dropped by <@${userId}>`,
                    )
                    .setImage(chosenCard.image); // Set the claimed card image

                await message.channel.send({
                    embeds: [confirmationEmbed],
                    allowedMentions: { users: [] },
                    reply: { messageReference: message.id },
                }); // Send confirmation to the channel

                // Create an updated row with all buttons disabled
                const updatedRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("card_1")
                        .setLabel(cards[0].group) // Disable if claimed
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId("card_2")
                        .setLabel(cards[1].group) // Disable if claimed
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId("card_3")
                        .setLabel(cards[2].group) // Disable if claimed
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                );

                // Edit the original message to update the buttons
                await msg.edit({ components: [updatedRow] });

                // Set the claimed flag to true
            });

            // Timeout to edit the embed footer after 15 seconds
            setTimeout(async () => {
                if (!claimed) {
                    const updatedEmbed = new EmbedBuilder(embed) // Create a copy of the original embed
                        .setFooter({ text: "Cards are no longer claimable." }); // Update the footer
                    await msg.edit({ embeds: [updatedEmbed] }); // Edit the message with the updated embed
                }
            }, 20000); // 20 seconds

            collector.on("end", () => {
                if (!claimed) {
                    msg.edit({ components: [] }); // Disable buttons after the collector ends if no card was claimed
                }
            });
        } catch (error) {
            await message.channel.send({
                content: `Error: ${error.message}`,
                allowedMentions: { users: [] },
                reply: { messageReference: message.id },
            });
        } finally {
            isExecuting = false; // Reset the flag in the finally block
        }
    },
};

// Function to get 3 random cards based on drop rates
async function getRandomCards(num) {
    // Fetch cards based on rarity categories
    const cardsByRarity = {
        normal: await Card.find({ rarity: "normal" }),
        sphere: await Card.find({ rarity: "sphere" }),
        rare: await Card.find({ rarity: "rare" }),
        event: await Card.find({ rarity: "event" }),
    };

    if (Object.values(cardsByRarity).every((cards) => cards.length === 0)) {
        throw new Error("No cards available to drop.");
    }

    // Define the drop probabilities for each rarity
    const dropRates = {
        normal: 0.55, // 55% chance
        sphere: 0.25, // 25% chance
        rare: 0.15, // 15% chance
        event: 0.05, // 5% chance
    };

    const selectedCards = [];

    // Select cards based on drop rates
    for (let i = 0; i < num; i++) {
        const randomNum = Math.random();
        let selectedCard;

        if (randomNum < dropRates.normal) {
            // Select a normal card
            selectedCard =
                cardsByRarity.normal[randomInt(0, cardsByRarity.normal.length)];
        } else if (randomNum < dropRates.normal + dropRates.sphere) {
            // Select a sphere card
            selectedCard =
                cardsByRarity.sphere[randomInt(0, cardsByRarity.sphere.length)];
        } else if (
            randomNum <
            dropRates.normal + dropRates.sphere + dropRates.rare
        ) {
            // Select a rare card
            selectedCard =
                cardsByRarity.rare[randomInt(0, cardsByRarity.rare.length)];
        } else {
            // Select an event card
            selectedCard =
                cardsByRarity.event[randomInt(0, cardsByRarity.event.length)];
        }

        if (selectedCard) {
            selectedCards.push(selectedCard);
        } else {
            i--; // Retry the iteration if no card is selected
        }
    }

    return selectedCards; // Return selected cards
}
