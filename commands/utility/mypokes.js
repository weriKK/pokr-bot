const { SlashCommandBuilder } = require('discord.js');
const Keyv = require('keyv').default;
const KeyvSqlite = require('@keyv/sqlite');
const path = require('path');

// Create an absolute path to the database file
const dbPath = path.join(__dirname, '../../data/reminders.sqlite');
const reminders = new Keyv(new KeyvSqlite(`sqlite://${dbPath}`));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mypokes')
        .setDescription('Show your pending poke reminders'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            // Query all reminders for this user
            const results = await reminders.store.query(
                'SELECT key, value FROM keyv WHERE key LIKE ? ORDER BY json_extract(value, "$.value.timestamp") ASC',
                [`keyv:poke_%_${interaction.user.id}`]
            );

            if (!results || results.length === 0) {
                return interaction.editReply('You have no pending pokes! 🎉');
            }

            const pokeList = results.map(({ value }) => {
                const reminder = JSON.parse(value).value;
                const timestamp = `<t:${Math.floor(reminder.timestamp / 1000)}:R>`;
                return `• ${reminder.reason} (${timestamp})`;
            }).join('\n');

            const embed = {
                color: 0x0099FF,
                title: '🔔 Your Pending Pokes',
                description: pokeList,
                footer: {
                    text: `Total pokes: ${results.length}`
                }
            };

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching pokes:', error);
            await interaction.editReply('Sorry, I had trouble fetching your pokes! 😅');
        }
    },
}; 