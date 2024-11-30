const { Events } = require('discord.js');
const pokeCommand = require('../commands/utility/poke.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);

        try {
            await pokeCommand.processNextReminder(client);
            console.log('Reminder scheduler initialized');
        } catch (error) {
            console.error('Failed to initialize reminder scheduler:', error);
        }
    },
};