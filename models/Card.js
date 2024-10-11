const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
    idolName: String,
    group: String,
    theme: String,
    rarity: { type: String, enum: ['normal', 'sphere', 'rare', 'event'] },
    cardID: { type: String, unique: true }, // Change to String
    image: String,
});

// Pre-save hook to generate the card ID based on rarity
cardSchema.pre('save', async function (next) {
    if (!this.cardID) {
        const prefix = this.rarity === 'normal' ? 'NR' :
                       this.rarity === 'sphere' ? 'SP' :
                       this.rarity === 'rare' ? 'RR' :
                       this.rarity === 'event' ? 'EV' : 'UN';

        // Generate a random 3-character alphanumeric string
        const randomString = Math.random().toString(36).substring(2, 5).toUpperCase(); // Generate 3 random characters
        this.cardID = prefix + randomString; // Concatenate prefix and random string
    }
    next();
});

module.exports = mongoose.model('Card', cardSchema);
