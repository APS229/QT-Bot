'use strict';

const fs = require('fs');

class Client {
    constructor() {
        this.discord = require('discord.js');
        this.bot = new this.discord.Client({ intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILD_PRESENCES'] });
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
        this.commands = new this.discord.Collection();
        const commandFiles = fs.readdirSync('./commands');
        for (const commandFile of commandFiles) {
            if (!commandFile.endsWith('.js')) continue;
            const file = require('../commands/' + commandFile);
            if (file.commands) {
                for (const cmd in file.commands) {
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
}
module.exports = new Client();
