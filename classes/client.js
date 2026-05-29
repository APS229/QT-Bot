'use strict';

const fs = require('fs');
const { REST, Routes, GatewayIntentBits, Collection, SlashCommandBuilder } = require('discord.js');
const DiscordClient = require('discord.js').Client;

class Client {
    constructor() {
        this.bot = new DiscordClient({
            intents: [GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent]
        });
        this.disconnected = false;
        this.disabled = false;
        this.restarting = false;
        this.games = new Map();
        this.events = null;
        this.data = {};
    }
    connect() {
        try {
            eval('let example = async () => {}');
        }
        catch (e) {
            console.log(`We require node version v8.0.0 or later, you're using ${process.version}`);
            process.exit(-1);
        }
        try {
            require.resolve('discord.js');
        }
        catch (e) {
            console.log('discord.js is not installed.\ninstalling...');
            const exec = require('child_process').exec;
            exec('npm install discord.js', (error, stdout, stderr) => {
                if (error) return console.log(`Couldn't install Discord.js: ${error}`);
                console.log(stdout + stderr);
            });
        }
        this.bot.login(Config.token);
        this.loadCommands();
        this.loadGames();
        this.events = new Events(this.bot);
        this.events.parse();
    }
    loadCommands() {
        this.commands = new Collection();
        const commandFiles = fs.readdirSync('./commands');
        for (const commandFile of commandFiles) {
            if (!commandFile.endsWith('.js')) continue;
            const file = require('../commands/' + commandFile);
            if (file.commands) {
                for (const cmd in file.commands) {
                    if (!file.commands[cmd].execute) {
                        console.warn(`WARNING: Skipped loading command '${cmd}' in ${commandFile} as it is missing execute() property`);
                        continue;
                    }
                    if (!file.commands[cmd].desc) file.commands[cmd].desc = 'No description';
                    this.commands.set(cmd, file.commands[cmd]);
                }
            }
        }
    }
    loadGames() {
        const gameFiles = fs.readdirSync('./games');
        for (const gameFile of gameFiles) {
            if (!gameFile.endsWith('.js') || gameFile === 'games.js') continue;
            const game = require('../games/' + gameFile);
            if (game.game) {
                game.game.prototype.id = Tools.toId(game.game.name);
                this.games.set(game.id, game.game);
            }
        }
        global.Games = require('../games/games.js');
    }
    // To be ran only when adding or updating slash commands
    async updateSlashCommands() {
        const rest = new REST().setToken(Config.token);
        const commands = [...this.commands].map(([commandName, commandData]) => {
            return {
                name: commandName,
                description: commandData.desc,
                options: commandData.options
            };
        });
        try {
            console.log(`Started refreshing ${commands.length} application (/) commands.`);

            // Peaceful Players - 777956702741463070
            const data = await rest.put(Routes.applicationGuildCommands(Config.id, '777956702741463070'), { body: commands });

            console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        }
        catch (err) {
            console.error(err);
        }
    }
}
module.exports = new Client();
