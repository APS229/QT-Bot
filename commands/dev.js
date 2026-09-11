'use strict';

const fs = require('fs');
const { ApplicationCommandOptionType, REST, Routes } = require('discord.js');

const commands = {
    kill: {
        modOnly: true,
        hidden: true,
        execute(interaction) {
            interaction.reply("Shutting down...");
            setTimeout(() => process.exit(), 500);
        }
    },
    js: {
        devOnly: true,
        hidden: true,
        clean(text) {
            if (typeof text === 'string') text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203));
            return text;
        },
        execute(interaction, target) {
            try {
                let evaled = eval(target);
                if (typeof evaled !== 'string') evaled = require('util').inspect(evaled);

                interaction.reply(`\`\`\`${this.clean(evaled)}\`\`\``, { code: "xl" });
            } catch (err) {
                interaction.reply(this.clean(err.stack));
            }
        }
    },
    reload: {
        devOnly: true,
        hidden: true,
        execute(interaction, target) {
            const validModules = ['config', 'games', 'tools', 'commands', 'events'];
            const module = Tools.toId(target);
            switch (module) {
                case 'config':
                    Tools.uncacheFile('../config/config.js');
                    global.Config = require('../config//config.js');
                    break;
                case 'games':
                    const games = fs.readdirSync('./games/');
                    for (const gameFile of games) {
                        Tools.uncacheFile('../games/' + gameFile);
                    }
                    Client.loadGames();
                    break;
                case 'tools':
                    Tools.uncacheFile('../classes/tools.js');
                    global.Tools = require('../classes/tools.js');
                    break;
                case 'commands':
                    const commands = fs.readdirSync('./commands/');
                    for (const commandFile of commands) {
                        Tools.uncacheFile('../commands/' + commandFile);
                    }
                    Client.loadCommands();
                    break;
                case 'events':
                    Tools.uncacheFile('../classes/events.js');
                    require('../classes/events.js')
                    break;
                default:
                    interaction.reply(`Invalid module.\nValid modules are: ${validModules.join(', ')}`);
                    return false;
            }
            interaction.reply(`Reloaded module: ${module}`);
        }
    },
    setrestart: {
        devOnly: true,
        hidden: true,
        execute(interaction) {
            Client.restart = true;
            interaction.reply("The bot has been set up to restart. No commands will work until the bot restarts.");
        }
    },
    cancelrestart: {
        devOnly: true,
        hidden: true,
        execute(interaction) {
            Client.restart = false;
            interaction.reply("The restart has been cancelled. Commands will work again.");
        }
    },
    // To be ran only when adding or updating slash commands in a server
    update: {
        devOnly: true,
        hidden: true,
        async execute(interaction, target) {
            let guildId = '', guildName = '';
            if (target) {
                if (Client.bot.guilds.cache.has(target)) {
                    guildId = target;
                    guildName = Client.bot.guilds.cache.get(target).name;
                }
                else {
                    return interaction.reply("Please specify a valid guild ID.");
                }
            }

            const rest = new REST().setToken(Config.token);
            const slashCommands = [...Client.slashCommands];
            const commands = [];
            for (const [commandName, commandData] of slashCommands) {
                const commandObject = {
                    name: commandName,
                    description: commandData.description
                };
                if (!commandData.execute || commandData.options?.length) {
                    commandObject.options = [];
                    if (!commandData.execute) {
                        for (const subcommand in commandData.subcommands) {
                            const subcommandObject = {
                                type: ApplicationCommandOptionType.Subcommand,
                                name: subcommand,
                                description: commandData.subcommands[subcommand].description || "No description."
                            };
                            if (commandData.subcommands[subcommand].options?.length) subcommandObject.options = commandData.subcommands[subcommand].options;
                            commandObject.options.push(subcommandObject);
                        }
                    }
                    if (commandData.options?.length) {
                        for (const option of commandData.options) {
                            commandObject.options.push(option);
                        }
                    }
                }
                commands.push(commandObject);
            }

            try {
                if (guildId) {
                    const guildCommandsMessage = await interaction.reply(`Started refreshing **${commands.length}** application (/) commands in **${guildName}** (${guildId}).`);

                    const data = await rest.put(Routes.applicationGuildCommands(Config.id, guildId), { body: commands });

                    guildCommandsMessage.edit(`${guildCommandsMessage.content}\n\nSuccessfully reloaded **${data.length}** application (/) commands in **${guildName}** (${guildId}).`);
                }
                else {
                    const globalCommandsMessage = await interaction.reply(`Started removing global application (/) commands.`);
                    
                    // In future if global application commands are added, replace the body array with the commands
                    await rest.put(Routes.applicationCommands(Config.id), { body: [] });

                    globalCommandsMessage.edit(globalCommandsMessage.content + `\n\nSuccessfully removed all global application (/) commands.`);
                }
            }
            catch (err) {
                console.error(err);
            }
        }
    }
};
exports.commands = commands;
