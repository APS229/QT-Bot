'use strict';

const http = require('http');

class Events {
    constructor(client) {
        this.bot = client;
    }
    parse() {
        this.bot.on('ready', async () => {
            if (Config.username) this.bot.user.setUsername(Config.username);
            info(`Logged in as: ${this.bot.user.username}`);
            const servers = [];
            for (const guild of this.bot.guilds.cache) {
                servers.push(`${guild[1].name} - ${guild[1].id}`);
            }
            if (!servers.length) return;
            info(`Connected to server${servers.length > 1 ? 's' : ''}:\n\t\u00b0 ${servers.sort().join('\n\t\u00b0 ')}`);
            if (Config.activity) this.bot.user.setActivity('to become a gaming bot', { type: Config.activity });
            const commands = [];
            for (const command of Client.commands) {
                commands.push({ name: command[0], description: command[1].desc, options: command[1].options });
            }
            this.bot.guilds.fetch('777956702741463070').then(guild => {
                guild.commands.set(commands.splice(commands.indexOf(commands.find(c => c.name === 'nickname')), 1));
            });
            this.bot.guilds.fetch('895344237204369458').then(guild => {
                guild.commands.set(commands);
            });
        });
        this.bot.on('shardError', err => {
            console.error(err);
        });
        this.bot.on('shardDisconnect', () => {
            info("Disconnected from shard");
        });
        this.bot.on('shardReconnecting', () => {
            info("Reconnecting to shard...");
        });
        this.bot.on('shardResume', () => {
            info("Re-connected to shard");
        });

        this.bot.on('messageCreate', async message => {
            if (message.author.bot || !Client.activeGame?.canGuess || !message.content.toLowerCase().startsWith('guess ') || Client.activeGame.channel.id !== message.channel.id) return;
            if (Client.activeGame?.type !== 'puzzle' && Client.activeGame?.id !== 'russianroulette') return;
            // if (discord.mentions.users.first() && discord.mentions.users.first().id === Config.id && message.startsWith('<@') && message.includes(Config.id)) {
            //     const question = message.slice(`<@${Config.id}>`.length + 1);
            //     http.get(`http://qmarkai.com/qmai.php?q=${question}`, (res, err) => {
            //         if (err) console.log(err);
            //         let data = '';
            //         res.on('data', chunk => data += chunk);
            //         res.on('end', () => channel.send(data));
            //     });
            // }
            try {
                Client.activeGame.onGuess(message.author.id, Tools.toId(message.content.slice(6)));
            }
            catch (err) {
                message.channel.send(`There was an error occured.`);
                if (Client.activeGame) Client.activeGame.onEnd();
                console.log(err);
            }
        });
        this.bot.on('interactionCreate', interaction => {
            try {
                const command = Client.commands.get(interaction.commandName) || Client.commands.get(interaction.customId);
                if (!command || !command.button && interaction.customId) return;
                if (command.devOnly && !Config.developers.includes(interaction.user.id)) return interaction.reply("This command is only for developers.");
                if (command.modOnly && !interaction.member.roles.cache.has('899916792447766528') &&
                    !interaction.member.permissions.toArray().includes('MANAGE_ROLES') && !Config.developers.includes(interaction.user.id)) {
                    return interaction.reply("You don't have permission to use this command.");
                }
                if (command.execute) command.execute(interaction);
            }
            catch (err) {
                interaction.reply(`There was an error occured.`);
                if (Client.activeGame) Client.activeGame.onEnd();
                console.log(err);
            }
        });
        // user Joining/leaving server
        this.bot.on('guildMemberAdd', member => {

        });
        this.bot.on('guildMemberRemove', member => {

        });

        // adding and removing bot from servers
        this.bot.on('guildCreate', guild => {
            info(`Joined new server: ${guild.name} - ${guild.id}`);
        });
        this.bot.on('guildDelete', guild => {
            info(`Left server: ${guild.name} - ${guild.id}`);
        });
    }
}

module.exports = Events;
