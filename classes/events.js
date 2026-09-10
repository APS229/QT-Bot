'use strict';

const http = require('http');
const DiscordEvents = require('discord.js').Events;
const { ActivityType, PermissionFlagsBits } = require('discord.js');

class Events {
    constructor(client) {
        this.bot = client;
    }
    parse() {
        this.bot.on(DiscordEvents.ClientReady, async () => {
            if (Config.username) this.bot.user.setUsername(Config.username);
            info(`Logged in as: ${this.bot.user.username}`);

            if (Config.activity) this.bot.user.setActivity(Config.activity);

            const servers = [];
            for (const guild of this.bot.guilds.cache) {
                servers.push(`${guild[1].name} - ${guild[1].id}`);
            }
            if (!servers.length) return;
            info(`Connected to server${servers.length > 1 ? 's' : ''}:\n\t\u00b0 ${servers.sort().join('\n\t\u00b0 ')}`);
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
            try {
                const commandName = messageContent.split(' ')[0].slice(1).toLowerCase();
                const command = Client.textCommands.get(commandName);
                if (message.channel.id === Database.query(message.guild.id).gameChannel && messageContent.startsWith(Config.cmdchar) && command) {
                    if (Client.restart && !command.devOnly) return message.reply("The bot is currently set up to restart. You cannot run any commands during the restart.");
                    if (command.devOnly && !Config.developers.includes(message.member.id)) return message.reply("This command is only for developers.");
                    if (command.modOnly && !message.member.permissions.has(PermissionFlagsBits.ManageChannels) &&
                        !message.member.roles.cache.has(Database.query(message.guild.id).manager) && !Config.developers.includes(message.member.id)) {
                        return message.reply("You don't have the permission to use this command.");
                    }
                    const target = messageContent.split(' ').splice(1).join(' ');
                    if (command.execute) command.execute(message, target);
                }
            }
            catch (err) {
                message.channel.send(`There was an error occured.`);
                if (Client.activeGame) Client.activeGame.onEnd();
                console.error(err);
            }
        });
        this.bot.on(DiscordEvents.InteractionCreate, interaction => {
            try {
                if (interaction.isAnySelectMenu()) {
                    interaction.reply({ content: "Select menus are currently disabled by the developer.", flags: 'Ephemeral' });
                }
                else {
                    if (interaction.commandName !== 'settings') {
                        const settings = Database.query(interaction.guild.id);
                        if (!settings.gameChannel) return interaction.reply({ content: "(Moderators) Please first set up the bot using the `/settings` command.", flags: 'Ephemeral' });
                        if (interaction.channel.id !== settings.gameChannel) return interaction.reply({ content: `You can only run commands in the <#${settings.gameChannel}> channel.`, flags: 'Ephemeral' });
                    }
                    let command = null;
                    if (interaction.isButton()) {
                        command = Client.slashCommands.get(interaction.customId) ||
                            Client.slashCommands.find(commandData => commandData.subcommands && commandData.subcommands[interaction.customId]).subcommands[interaction.customId];
                    }
                    else {
                        const parentCommand = Client.slashCommands.get(interaction.commandName);
                        command = parentCommand.subcommands ? parentCommand.subcommands[interaction.options.getSubcommand()] : parentCommand;
                    }

                    if (!command) return interaction.reply({ content: "This command is no longer available.", flags: 'Ephemeral' });
                    if (Client.restart && !command.devOnly) return interaction.reply({ content: "The bot is currently set up to restart. You cannot run any commands during the restart.", flags: 'Ephemeral' });
                    if (command.devOnly && !Config.developers.includes(interaction.user.id)) return interaction.reply({ content: "This command is only for developers.", flags: 'Ephemeral' });
                    if (command.modOnly && !interaction.member.permissions.has(PermissionFlagsBits.ManageChannels) &&
                        !interaction.member.roles.cache.has(Database.query(interaction.guild.id).manager) && !Config.developers.includes(interaction.member.id)) {
                        return interaction.reply({ content: "You don't have the permission to use this command.", flags: 'Ephemeral' });
                    }
                    if (command.execute) command.execute(interaction);
                }
            }
            catch (err) {
                interaction.reply("An error has occurred.");
                if (Client.activeGame) Client.activeGame.onEnd();
                console.error(err);
            }
        });

        // Adding and removing the bot from servers
        this.bot.on(DiscordEvents.GuildCreate, guild => {
            info(`Joined new server: ${guild.name} - ${guild.id}`);
        });
        this.bot.on(DiscordEvents.GuildDelete, guild => {
            info(`Left server: ${guild.name} - ${guild.id}`);
        });
    }
}

module.exports = Events;
