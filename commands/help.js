'use strict';

const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

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

const commands = {
    help: {
        desc: "Help for the bot commands.",
        execute(interaction) {
            // const target = null;
            // if (!target) {
            const embed = new EmbedBuilder()
                .setTitle(`Available commands in ${Config.username}`)
                .setAuthor({ name: Config.username, iconURL: Config.avatarURL })
                .setFooter({ text: `Requested by ${interaction.member.displayName}`, iconURL: interaction.member.avatarURL() ? interaction.member.avatarURL() : (interaction.user?.avatarURL() || interaction.author.avatarURL()) })
                .setTimestamp();
            const commandFiles = fs.readdirSync('./commands');
            for (const commandFile of commandFiles) {
                if (!commandFile.endsWith('.js') || commandFile === 'help.js') continue;
                const file = require('../commands/' + commandFile);
                if (file.commands) {
                    const type = Tools.toTitleCase(commandFile.split('.')[0]);
                    let commands = [];
                    for (const cmd in file.commands) {
                        if (file.commands[cmd].hidden) continue;
                        commands.push(cmd);
                    }
                    if (commands.length) {
                        commands.sort();
                        embed.addFields({ name: type, value: commands.join(', ') });
                    }
                }
            }
            interaction.reply({ embeds: [embed] });
            // }
            // else {
            //     target = Tools.toId(target);
            //     const cmdInfo = Client.commands.get(target);
            //     if (cmdInfo) {
            //         let required = 'User';
            //         if (cmdInfo.modOnly) required = 'Manager OR Manage Roles permission';
            //         const embed = new Client.discord.EmbedBuilder()
            //             .setTitle(`Help for the command: ${target}`)
            //             .setAuthor(Config.username, Config.avatarURL)
            //             .setFooter(`Requested by ${user.username}`, user.avatarURL)
            //             .setTimestamp()
            //             .addField('Description', cmdInfo.desc)
            //             .addField('Usage', cmdInfo.usage.join('\n'))
            //             .addField('Aliases', cmdInfo.aliases.join(', '))
            //             .addField('Requirement', required)
            //         channel.send({ embeds: [embed] });
            //     }
            //     else {
            //         channel.send("Command not found.");
            //     }
            // }
        }
    }
};
exports.commands = commands;
