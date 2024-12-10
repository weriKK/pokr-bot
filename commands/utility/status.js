const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Get bot status information'),

    async execute(interaction) {
        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        
        const deployDate = new Date(process.env.DEPLOY_TIME);
        const timestamp = `<t:${Math.floor(deployDate.getTime() / 1000)}:F>`;

        // Get all commands
        const commands = Array.from(interaction.client.commands.values());
        const commandList = commands
            .map(cmd => `\`/${cmd.data.name}\` - ${cmd.data.description}`)
            .join('\n');

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
                    value: timestamp,
                },
                {
                    name: '📡 Latency',
                    value: `Bot Latency: ${latency}ms\nWebSocket Latency: ${interaction.client.ws.ping}ms`
                },
                {
                    name: '🤖 Available Commands',
                    value: commandList,
                }
            ],
            timestamp: new Date().toISOString(),
        };

        await interaction.editReply({ content: null, embeds: [statusEmbed] });
    },
}; 