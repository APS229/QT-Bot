'use strict';

const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

const commands = {
    help: {
        description: "Help for the bot commands.",
        execute(interaction) {
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
                    for (const command in file.commands) {
                        const commandData = file.commands[command];
                        if (commandData.hidden) continue;
                        if (commandData.subcommands) {
                            for (const subcommand in commandData.subcommands) {
                                commands.push(subcommand);
                            }
                            continue;
                        }
                        commands.push(command);
                    }
                    if (commands.length) {
                        commands.sort();
                        embed.addFields({ name: type, value: commands.join(', ') });
                    }
                }
            }
            interaction.reply({ embeds: [embed] });
        }
    }
};
exports.commands = commands;
