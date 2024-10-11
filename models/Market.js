const mongoose = require("mongoose");

const marketSchema = new mongoose.Schema({
    cardID: { type: String, required: true },
    price: { type: Number, required: true },
    sellerId: { type: String, required: true },
    idolName: { type: String, required: true }, // Add this field
    theme: { type: String, required: true }, // Add this field
    rarity: { type: String, required: true }, // Add this field
    group: { type: String, required: true }
});

module.exports = mongoose.model("Market", marketSchema);
