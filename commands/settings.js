'use strict';

const { PermissionFlagsBits } = require("discord.js");

const OptionTypes = {
    STRING: 3,
    INTEGER: 4,
    BOOLEAN: 5,
    USER: 6,
    CHANNEL: 7,
    ROLE: 8,
    NUMBER: 10,
    ATTACHMENT: 11
};

const DANGER_PERMISSIONS = [
    PermissionFlagsBits.Administrator,
    PermissionFlagsBits.ManageGuild,
    PermissionFlagsBits.ManageRoles,
    PermissionFlagsBits.ManageChannels,
    PermissionFlagsBits.ManageWebhooks,
    PermissionFlagsBits.KickMembers,
    PermissionFlagsBits.BanMembers
];

const REQUIRED_PERMISSIONS = [
    PermissionFlagsBits.AttachFiles,
    PermissionFlagsBits.EmbedLinks,
    PermissionFlagsBits.SendMessages
];

const commands = {
    settings: {
        options: [
            {
                type: OptionTypes.CHANNEL,
                name: 'channel',
                description: "The channel all the games should run in.",
                required: true
            },
            {
                type: OptionTypes.ROLE,
                name: 'manager',
                description: "The role that manages the games in this server.",
                required: true
            }
        ],
        modOnly: true,
        desc: "Configure the bot's settings for this server.",
        execute(interaction) {
            if (interaction.content) return interaction.reply("Please use the slash command.");

            const options = interaction.options?._hoistedOptions;

            const bot = interaction.guild.members.me;

            const activeDangerPerms = DANGER_PERMISSIONS.filter(perm => bot.permissions.has(perm));
            if (activeDangerPerms.length) {
                const activeDangerPermsNames = "```diff\n- " + activeDangerPerms.map(perm => Object.keys(PermissionFlagsBits).find(key => PermissionFlagsBits[key] === perm)).join('\n- ') + "```";
                return interaction.reply(`The bot has the following dangerous permissions:\n${activeDangerPermsNames}\nPlease remove these permissions in the server settings before continuing.`);
            }

            const channelPerms = options[0].channel.permissionsFor(bot);
            if (!channelPerms.has(PermissionFlagsBits.ViewChannel)) {
                return interaction.reply("No permissions to view the specified channel.");
            }
            const inactiveRequiredPerms = REQUIRED_PERMISSIONS.filter(perm => !channelPerms.has(perm))
            if (inactiveRequiredPerms.length) {
                const inactiveRequiredPermsNames = "```diff\n+ " + inactiveRequiredPerms.map(perm => Object.keys(PermissionFlagsBits).find(key => PermissionFlagsBits[key] === perm)).join('\n+ ') + "```";
                return interaction.reply(`The bot is missing the following permissions in the specified channel:\n${inactiveRequiredPermsNames}\nPlease edit the channel to include these permissions for the bot.`);
            }
            const success = Database.create(interaction.guild.id, options[0].value, options[1].value);
            if (!success) return interaction.reply("There was an error setting up the bot.");
            interaction.reply({
                content: `Successfully set up the bot to use the channel <#${options[0].value}> with the games manager role <@&${options[1].value}>!`,
                allowedMentions: {
                    roles: []
                }
            });
        }
    }
};

exports.commands = commands;