const { EmbedBuilder } = require("discord.js");
const User = require("../models/User");

module.exports = {
    name: "cd",
    description: "Check your command cooldowns.",
    async execute(message) {
        const userId = message.author.id;
        const user = await User.findOne({ userId });

        // Check if the user is registered
        if (!user) {
            return message.reply(
                "You need to register first by using the !start command.",
                {
                    allowedMentions: { users: [] }, // Prevents pinging the user
                },
            );
        }

        const now = Date.now();
        let cooldownMessage = "You have no active cooldowns.";

        // Function to convert seconds into hh:mm:ss format
        const formatTime = (seconds) => {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            return `${hours}h ${minutes}m ${secs}s`;
        };

        // Check daily cooldown
        if (user.lastDailyClaim) {
            const dailyCooldown = 86400000; // 24 hours in milliseconds
            const timeSinceClaimed = now - user.lastDailyClaim;
            if (timeSinceClaimed < dailyCooldown) {
                const remaining = Math.ceil(
                    (dailyCooldown - timeSinceClaimed) / 1000,
                );
                cooldownMessage = `⏲️ Daily: \`${formatTime(remaining)}\``;
            } else {
                cooldownMessage = "You can claim your daily rewards now!";
            }
        }

        // Check weekly cooldown
        if (user.lastWeeklyClaim) {
            const weeklyCooldown = 604800000; // 7 days in milliseconds
            const timeSinceClaimed = now - user.lastWeeklyClaim;
            if (timeSinceClaimed < weeklyCooldown) {
                const remaining = Math.ceil(
                    (weeklyCooldown - timeSinceClaimed) / 1000,
                );
                cooldownMessage += `\nWeekly cooldown: ${formatTime(remaining)} remaining.`;
            } else {
                cooldownMessage += "\nYou can claim your weekly rewards now!";
            }
        }

        // Check drop cooldown
        if (user.lastDrop) {
            const dropCooldown = 15000; // 5 secs in milliseconds
            const timeSinceDropped = now - user.lastDrop;
            if (timeSinceDropped < dropCooldown) {
                const remaining = Math.ceil(
                    (dropCooldown - timeSinceDropped) / 1000,
                );
                cooldownMessage += `\n⏲️ Drop: \`${formatTime(remaining)}\``;
            } else {
                cooldownMessage += "\n✅ **You can drop cards now!**";
            }
        }

        // Create embed for cooldowns
        const embed = new EmbedBuilder()
            .setTitle(`${message.author.username}'s Cooldowns`)
            .setDescription(cooldownMessage)
            .setColor("#ffffff");

        // Reply with the embed without pinging the user
        message.channel.send({
            embeds: [embed],
            allowedMentions: { users: [] },
        });
    },
};
