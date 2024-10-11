const User = require("../models/User");
const Card = require("../models/Card");
const { EmbedBuilder } = require("discord.js");
const { randomInt } = require("crypto");

module.exports = {
    name: "daily",
    description: "Claim your daily rewards.",
    cooldown: 86400000, // 24 hours in milliseconds
    async execute(message) {
        const userId = message.author.id;
        const user = await User.findOne({ userId });

        // Check if the user is registered
        if (!user) {
            return message.reply(
                "You need to register first by using the !start command.",
            );
        }

        const now = Date.now();

        // Check if user has already claimed daily rewards today
        const lastClaimed = user.lastDailyClaim || 0;
        if (now - lastClaimed < this.cooldown) {
            const remaining = Math.ceil(
                (this.cooldown - (now - lastClaimed)) / 1000,
            );
            return message.reply(
                `You must wait ${remaining} seconds before claiming your daily rewards again.`,
            );
        }

        // Grant rewards
        const newCards = await getRandomCards(2); // Get 2 random cards
        user.cards.push(...newCards.map((card) => card.cardID)); // Push card IDs to user
        user.tokens += 50; // Grant tokens
        user.lastDailyClaim = now; // Update last claimed time
        await user.save();

        // Create an embed to display the cards
        const embed = new EmbedBuilder()
            .setColor(15262921)
            .setTitle("Daily Rewards Claimed!")
            .setDescription("You have claimed your daily rewards:")
            .addFields(
                newCards.map((card, index) => ({
                    name: `Card ${index + 1}`,
                    value: `**Idol:** ${card.idolName}\n**Rarity:** ${card.rarity}\n**Group:** ${card.group}\n**Theme:** ${card.theme}`,
                    inline: true,
                })),
            )
            .setFooter({ text: `You also received 50 tokens!!` });

        await message.channel.send({ embeds: [embed] });
    },
};

// Function to get 2 random cards
async function getRandomCards(num) {
    const totalCards = await Card.find(); // Fetch all cards from the database

    if (totalCards.length === 0) {
        throw new Error("No cards available to drop.");
    }

    const selectedCards = [];
    const cardIds = new Set(); // To prevent duplicates

    while (selectedCards.length < num) {
        const randomIndex = randomInt(totalCards.length);
        const card = totalCards[randomIndex];

        if (!cardIds.has(card.cardID)) {
            selectedCards.push(card);
            cardIds.add(card.cardID);
        }
    }

    return selectedCards;
}
