const User = require("../models/User");
const Market = require("../models/Market");
const Card = require("../models/Card"); // Assuming you have a Card model for card details

module.exports = {
    name: "sell",
    description: "Sell a card on the market.",
    async execute(message, args) {
        const userId = message.author.id;
        const user = await User.findOne({ userId });

        if (!user) {
            return message.channel.send("You need to register first by using the !start command.");
        }

        const [cardID, price] = args;

        // Validate price
        if (isNaN(price) || price <= 0) {
            return message.channel.send("Please provide a valid price greater than zero.");
        }

        // Check if the user has the card
        const cardCount = user.cards.filter(id => id === cardID).length;

        if (cardCount === 0) {
            return message.channel.send("You do not own this card.");
        }

        // Retrieve the card details from the Card model (if applicable)
        const card = await Card.findOne({ cardID }); // Adjust if you have a different method of accessing card details

        if (!card) {
            return message.channel.send("Card not found.");
        }

        // Remove one instance of the card from the user's inventory
        user.cards.splice(user.cards.indexOf(cardID), 1); // Remove only one instance
        await user.save();

        // Add the card to the market with additional details
        await Market.create({
            cardID,
            price,
            sellerId: userId,
            idolName: card.idolName,
            theme: card.theme,
            rarity: card.rarity,
            group: card.group
        });

        return message.channel.send(`Card **${cardID}** has been listed for sale at **${price}** tokens.`);
    },
};
