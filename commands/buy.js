const Market = require("../models/Market");
const User = require("../models/User");

module.exports = {
    name: "buy",
    description: "Buy a card from the market.",
    async execute(message, args) {
        const cardID = args[0];

        // Check if the card ID was provided
        if (!cardID) {
            return message.channel.send("Please provide the card ID you want to buy.");
        }

        // Find the market listing for the given card ID
        const marketListing = await Market.findOne({ cardID });

        // Check if the card is listed in the market
        if (!marketListing) {
            return message.channel.send("This card is not available in the market.");
        }

        // Find the buyer's user document
        const buyerId = message.author.id;
        const buyer = await User.findOne({ userId: buyerId });

        // Check if the buyer is trying to buy their own card
        if (marketListing.sellerId === buyerId) {
            return message.channel.send("You cannot buy your own card.");
        }

        // Check if the buyer has enough tokens
        if (buyer.tokens < marketListing.price) {
            return message.channel.send("You do not have enough tokens to buy this card.");
        }

        // Deduct the price from the buyer's balance
        buyer.tokens -= marketListing.price;
        await buyer.save();

        // Find the seller's user document
        const seller = await User.findOne({ userId: marketListing.sellerId });

        // Add the price to the seller's balance
        seller.tokens += marketListing.price;
        await seller.save();

        // Add the card to the buyer's inventory
        buyer.cards.push(cardID);
        await buyer.save();

        // Remove the card from the market
        await Market.deleteOne({ cardID });

        // Notify the users
        await message.channel.send(`You have successfully bought card ID: ${cardID} for ${marketListing.price} tokens.`);
        // await message.channel.send(`Card ID: ${cardID} has been sold to <@${buyerId}> by <@${marketListing.sellerId}>.`);
    },
};
