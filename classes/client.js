'use strict';

const fs = require('fs');
let Shop = require('./shop.js');

class Client {
	constructor() {
		this.discord = require('discord.js');
		this.bot = new this.discord.Client({ intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGES'] });
		this.commands = new this.discord.Collection();
		this.shop = {};
		this.disconnected = false;
		this.disabled = false;
		this.games = new Map();
		this.events = null;
		this.setPrototypes();
	}
	setPrototypes() {
		this.discord.DMChannel.prototype.say = async function(message) {
			if (!message) return;
			if (typeof message !== 'string') message = message.toString();
			if (message.length > 2000) return this.send("Message is too big to send!");
			await this.send(message);
		};
		this.discord.TextChannel.prototype.say = async function(message) {
			if (!message) return;
			if (typeof message !== 'string') message = message.toString();
			if (message.length > 2000) return this.send("Message is too big to send!");
			await this.send(message);
		};
		this.discord.User.prototype.say = async function(message) {
			if (!message) return;
			if (typeof message !== 'string') message = message.toString();
			if (message.length > 2000) return this.send("Message is too big to send!");
			await this.send(message);
		};
		this.discord.User.prototype.owner = false;
		// this.discord.User.prototype.guild = this.discord.User.prototype.lastMessage && this.discord.User.prototype.lastMessage.member ? this.discord.User.prototype.lastMessage.member.guild : this.discord.User;
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
		this.shop = new Shop({}, {});
		this.events = new Events(this.bot);
		this.events.parse();
	}
	loadCommands() {
		const commandFiles = fs.readdirSync('./commands');
		for (const commandFile of commandFiles) {
			if (!commandFile.endsWith('.js')) continue;
			const file = require('../commands/' + commandFile);
			if (file.commands) {
				for (const cmd in file.commands) {
					if (!file.commands[cmd].desc) file.commands[cmd].desc = 'No description';
					if (!file.commands[cmd].aliases || (file.commands[cmd].aliases && !file.commands[cmd].aliases.length)) file.commands[cmd].aliases = ['No aliases'];
					if (!file.commands[cmd].hidden && (!file.commands[cmd].usage || !Array.isArray(file.commands[cmd].usage) || !file.commands[cmd].usage.length)) file.commands[cmd].usage = ['No usage set for this command.'];
					this.commands.set(cmd, file.commands[cmd]);
				}
			}
		}
	}
	loadGames() {
		const gameFiles = fs.readdirSync('./games');
		for (const gameFile of gameFiles) {
			if (!gameFile.endsWith('.js')) continue;
			const game = require('../games/' + gameFile);
			if (game.game) {
				game.game.prototype.id = Tools.toId(game.game.name);
				this.games.set(game.id, game.game);
			}
		}
	}
}
module.exports = new Client();
