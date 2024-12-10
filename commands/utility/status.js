const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Get bot status information'),

    async execute(interaction) {
        const sent = await interaction.reply({ content: 'Pinging...', ephemeral: true, fetchReply: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        
        const statusEmbed = {
            color: 0x0099FF,
            title: 'Bot Status',
            fields: [
                {
                    name: '🏗️ Build Info',
                    value: `Image: \`${process.env.IMAGE_NAME}:${process.env.BUILD_NUMBER}\``,
                },
                {
                    name: '📅 Deployment Time',
                    value: new Date(process.env.DEPLOY_TIME).toLocaleString(),
                },
                {
                    name: '📡 Latency',
                    value: `Bot Latency: ${latency}ms\nWebSocket Latency: ${interaction.client.ws.ping}ms`,
                }
            ],
            timestamp: new Date().toISOString(),
        };

        await interaction.editReply({ content: null, embeds: [statusEmbed] });
    },
}; 