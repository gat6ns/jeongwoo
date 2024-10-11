const User = require('../models/User');

async function registerUser(userId) {
    let user = await User.findOne({ userId });
    if (!user) {
        user = new User({
            userId,
            cards: [],
            tokens: 0,
            lastDailyClaim: null,
            lastWeeklyClaim: null,
            lastDrop: null,
            favoriteCard: null,
            favoriteCardImageUrl: null,
            dateJoined: Date.now(), // Store the date when the user joined
        });
        await user.save();
    }
    return user;
}

module.exports = registerUser;
