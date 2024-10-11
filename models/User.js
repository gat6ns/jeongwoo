const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: String, unique: true },
    tokens: { type: Number, default: 0 },
    cards: { type: [String], default: [] }, // Change Number to String here
    favoriteCard: { type: [String], default: [] },
    favoriteCardImageUrl: { type: [String], default: [] },
    dateJoined: { type: Date, default: Date.now },
    lastDrop: { type: Date },
    lastDailyClaim: { type: Date },
});

module.exports = mongoose.model('User', userSchema);
