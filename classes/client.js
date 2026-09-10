'use strict';

const fs = require('fs');
const { Collection, GatewayIntentBits } = require('discord.js');
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
        this.games = new Collection();
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
        this.slashCommands = new Collection();
        this.textCommands = new Collection();
        const commandFiles = fs.readdirSync('./commands');
        for (const commandFile of commandFiles) {
            if (!commandFile.endsWith('.js')) continue;
            const file = require('../commands/' + commandFile);
            if (file.commands) {
                commandLoop: for (const commandName in file.commands) {
                    const commandData = file.commands[commandName];
                    if (!commandData.execute) {
                        if (Tools.isEmptyObject(commandData.subcommands)) {
                            console.warn(`WARNING: Skipped loading command '${commandName}' in file ${commandFile} as it is missing 'execute()' property`);
                        }
                        else {
                            for (const subcommandData of Object.values(commandData.subcommands)) {
                                if (!subcommandData.execute) {
                                    console.warn(`WARNING: Skipped loading command '${commandName}' in file ${commandFile} as the subcommands are missing 'execute()' property`);
                                    continue commandLoop;
                                }
                            }
                        }
                    }
                    if (!commandData.description) commandData.description = "No description.";
                    if (commandData.slashCommand) this.slashCommands.set(commandName, commandData);
                    if (!commandData.execute) {
                        for (const subcommand in commandData.subcommands) {
                            this.textCommands.set(subcommand, commandData.subcommands[subcommand]);
                        }
                    }
                    else {
                        this.textCommands.set(commandName, commandData);
                    }
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
}
module.exports = new Client();
