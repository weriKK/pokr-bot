const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');

const { appId, guildId, token } = require('./config.json');

const commands = [];

// Grab all the command folders from the commands directory
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {

	// Grab all the command files from the commands directory
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const rest = new REST().setToken(token);

// Deploy the commands!
(
    async () => {
        try {
            console.log(`Started refreshing ${commands.length} application  (/) commands.`);

            rest.put(Routes.applicationGuildCommands(appId, guildId), { body: [] })
            .then(() => console.log('Successfully deleted all guild commands.'))
            .catch(console.error);            

            rest.put(Routes.applicationCommands(appId), { body: [] })
	        .then(() => console.log('Successfully deleted all application commands.'))
	        .catch(console.error);

            const data = await rest.put(
                //Routes.applicationCommand(appId, guildId),
                Routes.applicationGuildCommands(appId, guildId),
                { body: commands },
            );

            console.log(`Successfully reloaded ${data.length} application (/) commands.`);

        } catch (error) {
            console.error(error);
        }
    }
)();