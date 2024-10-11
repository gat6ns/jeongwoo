const mongoose = require('mongoose');
const fs = require('fs');
const Card = require('./models/Card'); // Update path as necessary

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('MongoDB connected');
        importCards();
    })
    .catch(err => console.error(err));

// Create a counters object to track the last used ID for each rarity
const counters = {
    normal: 0,
    sphere: 0,
    rare: 0,
    event: 0,
};

async function importCards() {
    try {
        const data = fs.readFileSync('cards.json'); // Update the path to your JSON file
        const cards = JSON.parse(data);

        for (const card of cards) {
            const rarity = card.rarity.toLowerCase(); // Ensure the rarity is lowercase
            if (counters[rarity] === undefined) {
                console.error(`Unknown rarity: ${rarity}`);
                continue; // Skip cards with unknown rarity
            }

            // Increment the counter and generate the cardID
            counters[rarity]++;
            const uniqueID = generateCardID(rarity, counters[rarity]);

            // Check if a card with the same cardID already exists
            const existingCard = await Card.findOne({ cardID: uniqueID });
            if (existingCard) {
                console.log(`Skipping duplicate card with ID: ${uniqueID}`);
                continue; // Skip this card if it already exists
            }

            // Create a new Card object with the generated cardID
            const newCard = new Card({ ...card, cardID: uniqueID }); // Use spread to include other card fields
            await newCard.save();
            console.log(`Successfully added card with ID: ${uniqueID}`);
        }

        console.log('Cards imported successfully');
    } catch (error) {
        console.error('Error importing cards:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Function to generate a unique card ID based on rarity and incremental number
function generateCardID(rarity, number) {
    // Pad the number with leading zeros if necessary to ensure it's three digits
    const paddedNumber = String(number).padStart(3, '0');
    const prefix = {
        normal: 'NR',
        sphere: 'SP',
        rare: 'RR',
        event: 'EV',
    }[rarity];

    return `${prefix}${paddedNumber}`;
}
