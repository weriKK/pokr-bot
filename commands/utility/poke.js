const Keyv = require('keyv').default;
const KeyvSqlite = require('@keyv/sqlite');
const path = require('path');
const fs = require('fs');
const { SlashCommandBuilder } = require('discord.js');

// Create an absolute path to the database file
const dbPath = path.join(__dirname, '../../data/reminders.sqlite');
console.log('Database path:', dbPath);

// Ensure the data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    console.log('Creating data directory:', dataDir);
    fs.mkdirSync(dataDir, { recursive: true });
}

// const reminders = new Keyv(`sqlite://${dbPath}`);
const reminders = new Keyv(new KeyvSqlite(`sqlite://${dbPath}`));

// Add more detailed error logging
reminders.on('error', err => {
    console.error('Keyv connection error:', err);
    console.error('Database path:', dbPath);
});

let nextReminderTimeout = null;

// Helper function to parse time input (e.g., "1h", "30m", "2d")
function parseTime(timeStr) {
    const units = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000
    };
    
    const match = timeStr.match(/^(\d+)([smhd])$/);
    if (!match) return null;
    
    const [, amount, unit] = match;
    return parseInt(amount) * units[unit];
}

async function sendReminder(client, reminder, reminderId) {
    try {
        const user = await client.users.fetch(reminder.userId);
        const pokeEmojis = ['👉', '🫵', '👆', '😜', '🤔'];
        const randomEmoji = pokeEmojis[Math.floor(Math.random() * pokeEmojis.length)];
        await user.send(`${randomEmoji} *poke poke* - ${reminder.reason}`);
        await reminders.store.query('DELETE FROM keyv WHERE key = ?', [reminderId]);
        processNextReminder(client);
    } catch (error) {
        console.error(`Failed to send reminder ${reminderId}:`, error);
    }
}

async function processNextReminder(client) {
    try {
        if (nextReminderTimeout) {
            clearTimeout(nextReminderTimeout);
        }

        const [nextReminder] = await reminders.store.query(
            'SELECT key, value FROM keyv WHERE key LIKE ? ORDER BY json_extract(value, "$.value.timestamp") ASC LIMIT 1',
            ['keyv:poke_%']
        );

        if (!nextReminder) {
            return;
        }

        const { key: reminderId, value } = nextReminder;
        const reminder = JSON.parse(value).value;
        const delay = reminder.timestamp - Date.now();

        if (delay <= 0) {
            await sendReminder(client, reminder, reminderId);
        } else {
            nextReminderTimeout = setTimeout(() => sendReminder(client, reminder, reminderId), delay);
            console.log(`Next reminder scheduled for ${new Date(reminder.timestamp).toLocaleString()}`);
        }
    } catch (error) {
        console.error('Error processing reminder:', error);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poke')
        .setDescription('Set a reminder to poke you later')
        .addStringOption(option =>
            option.setName('time')
                .setDescription('When to poke you (e.g., 1h, 30m, 2d)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Why should I poke you?')
                .setRequired(true)),

    async execute(interaction) {
        const timeStr = interaction.options.getString('time');
        const reason = interaction.options.getString('reason');
        
        const milliseconds = parseTime(timeStr);
        if (!milliseconds) {
            return interaction.reply({ 
                content: 'Invalid time format! Please use something like 1h, 30m, or 2d',
                ephemeral: true 
            });
        }

        const reminder = {
            userId: interaction.user.id,
            channelId: interaction.channelId,
            reason: reason,
            timestamp: Date.now() + milliseconds
        };

        const reminderId = `poke_${Date.now()}_${interaction.user.id}`;
        await reminders.set(reminderId, reminder);

        await interaction.reply({ 
            content: `I'll poke you about "${reason}" in ${timeStr} 👉`,
            ephemeral: true 
        });

        // Schedule next reminder
        await processNextReminder(interaction.client);        
    },
    processNextReminder
};

