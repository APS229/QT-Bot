'use strict';

const http = require('http');
const DiscordEvents = require('discord.js').Events;
const { ActionRowBuilder, Collection, SlashCommandBuilder } = require('discord.js');

class Events {
    constructor(client) {
        this.bot = client;
    }
    parse() {
        this.bot.on(DiscordEvents.ClientReady, async () => {
            if (Config.username) this.bot.user.setUsername(Config.username);
            info(`Logged in as: ${this.bot.user.username}`);

            const servers = [];
            for (const guild of this.bot.guilds.cache) {
                servers.push(`${guild[1].name} - ${guild[1].id}`);
            }
            if (!servers.length) return;
            info(`Connected to server${servers.length > 1 ? 's' : ''}:\n\t\u00b0 ${servers.sort().join('\n\t\u00b0 ')}`);

            if (Config.activity) this.bot.user.setActivity('to become a gaming bot', { type: Config.activity });

            const commands = new Collection();
            for (const command of Client.commands) {
                commands.set(command[0], command[1]);
            }
            this.bot.guilds.fetch('777956702741463070').then(guild => {
                guild.commands = commands;
            });
        });

        this.bot.on(DiscordEvents.ShardError, err => {
            console.error(err);
        });
        this.bot.on(DiscordEvents.ShardDisconnect, () => {
            info("Disconnected from shard");
        });
        this.bot.on(DiscordEvents.ShardReconnecting, () => {
            info("Reconnecting to shard...");
        });
        this.bot.on(DiscordEvents.ShardResume, () => {
            info("Re-connected to shard");
        });

        this.bot.on(DiscordEvents.MessageCreate, async message => {
            if (message.author.bot) return;
            const messageContent = message.content;
            if (message.mentions.users.first() && message.mentions.users.first().id === Config.id && messageContent.startsWith('<@') && messageContent.includes(Config.id)) {
                const question = messageContent.slice(`<@${Config.id}>`.length + 1);
                http.get(`http://qmarkai.com/qmai.php?q=${question}`, (res, err) => {
                    if (err) console.log(err);
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => message.reply(data));
                });
            }
            const command = Client.commands.get(messageContent.split(' ')[0].slice(1).toLowerCase());
            if (messageContent.startsWith(Config.cmdchar) && command) {
                if (Client.restart && !command.devOnly) return message.reply("The bot is currently set up to restart. You cannot run any commands during the restart.");
                if (command.devOnly && !Config.developers.includes(message.member.id)) return message.reply("This command is only for developers.");
                if (command.modOnly && !message.member.permissions.toArray().includes('ManageRoles') && !Config.developers.includes(message.member.id)) {
                    return message.reply("You don't have permission to use this command.");
                }
                if (command.execute) command.execute(message);
            }
            if (!Client.activeGame?.canGuess || !message.content.toLowerCase().startsWith('guess ') || Client.activeGame.channel.id !== message.channel.id) return;
            if (Client.activeGame?.type !== 'puzzle' && Client.activeGame?.id !== 'russianroulette') return;
            try {
                Client.activeGame.onGuess(message.member.id, Tools.toId(messageContent.slice(6)));
            }
            catch (err) {
                message.channel.send(`There was an error occured.`);
                if (Client.activeGame) Client.activeGame.onEnd();
                console.log(err);
            }
        });
        this.bot.on(DiscordEvents.InteractionCreate, interaction => {
            try {
                if (interaction.isStringSelectMenu()) {
                    if (Client.activeGame?.id !== 'empires') return interaction.reply({ content: "There is no game of Empires going on right now.", flags: 'Ephemeral' });
                    Client.activeGame.onGuess(interaction);
                }
                else {
                    const command = Client.commands.get(interaction.commandName) || Client.commands.get(interaction.customId);
                    if (Client.restart && !command.devOnly) return interaction.reply("The bot is currently set up to restart. You cannot run any commands during the restart.");
                    if (!command || !command.button && interaction.customId) return;
                    if (command.devOnly && !Config.developers.includes(interaction.user.id)) return interaction.reply("This command is only for developers.");
                    if (command.modOnly && !interaction.member.permissions.toArray().includes('ManageRoles') && !Config.developers.includes(interaction.user.id)) {
                        return interaction.reply("You don't have permission to use this command.");
                    }
                    if (command.execute) command.execute(interaction);
                }
            }
            catch (err) {
                interaction.reply(`There was an error occured.`);
                if (Client.activeGame) Client.activeGame.onEnd();
                console.log(err);
            }
        });

        // adding and removing bot from servers
        this.bot.on(DiscordEvents.GuildCreate, guild => {
            info(`Joined new server: ${guild.name} - ${guild.id}`);
        });
        this.bot.on(DiscordEvents.GuildDelete, guild => {
            info(`Left server: ${guild.name} - ${guild.id}`);
        });
    }
}

module.exports = Events;
