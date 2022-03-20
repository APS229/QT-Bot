'use strict';

const fs = require('fs');

const commands = {
    help: {
        aliases: ['commands', 'cmds'],
        desc: 'Gives you help for every command.',
        usage: ['.help', '.help [command]'],
        execute(target, channel, user, server, client) {
            if (!target) {
                const embed = new Client.discord.MessageEmbed()
                    .setTitle("Available commands in Qt Bot")
                    .setAuthor(Config.username, Config.avatarURL)
                    .setFooter(`Requested by ${user.username}`, user.avatarURL)
                    .setTimestamp();
                const commandFiles = fs.readdirSync('./commands');
                for (const commandFile of commandFiles) {
                    if (!commandFile.endsWith('.js')) continue;
                    if (commandFile === 'help.js') continue;
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
                            embed.addField(type, commands.join(', '));
                        }
                    }
                }
                channel.send({ embeds: [embed] });
            }
            else {
                target = Tools.toId(target);
                const cmdInfo = Client.commands.get(target);
                if (cmdInfo) {
                    let required = 'User';
                    if (cmdInfo.mod) required = 'Moderator';
                    if (cmdInfo.supermod) required = 'Super Moderator';
                    const embed = new Client.discord.MessageEmbed()
                        .setTitle(`Help for the command: ${target}`)
                        .setAuthor(Config.username, Config.avatarURL)
                        .setFooter(`Requested by ${user.username}`, user.avatarURL)
                        .setTimestamp()
                        .addField('Description', cmdInfo.desc)
                        .addField('Usage', cmdInfo.usage.join('\n'))
                        .addField('Aliases', cmdInfo.aliases.join(', '))
                        .addField('Requirement', required)
                    channel.send({ embeds: [embed] });
                }
                else {
                    channel.say("Command not found.");
                }
            }
        }
    }
};
exports.commands = commands;
