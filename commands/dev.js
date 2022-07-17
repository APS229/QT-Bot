'use strict';

const fs = require('fs');

const commands = {
    kill: {
        devOnly: true,
        hidden: true,
        execute(interaction) {
            interaction.reply("Shutting down...");
            setTimeout(() => {
                process.exit();
            }, 500);
        }
    },
    js: {
        devOnly: true,
        hidden: true,
        clean(text) {
            if (typeof text === 'string') text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203));
            return text;
        },
        options: [
            {
                type: "STRING",
                name: "code",
                description: "Code to evaluate.",
                required: true
            }
        ],
        execute(interaction) {
            try {
                let evaled = eval(interaction.options._hoistedOptions[0].value);
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
        options: [
            {
                type: "STRING",
                name: "module",
                description: "Module you want to reload.",
                required: true
            }
        ],
        execute(interaction) {
            const validModules = ['config', 'games', 'tools', 'commands', 'events'];
            const module = Tools.toId(interaction.options._hoistedOptions[0].value);
            switch (module) {
                case 'config':
                    Tools.uncacheTree('../config.js');
                    global.Config = require('../config.js');
                    break;
                case 'games':
                    const games = fs.readdirSync('./games/');
                    for (const gameFile of games) {
                        Tools.uncacheTree('../games/' + gameFile);
                    }
                    Client.loadGames();
                    break;
                case 'tools':
                    Tools.uncacheTree('../classes/tools.js');
                    global.Tools = require('../classes/tools.js');
                    break;
                case 'commands':
                    const commands = fs.readdirSync('./commands/');
                    for (const commandFile of commands) {
                        Tools.uncacheTree('../commands/' + commandFile);
                    }
                    Client.loadCommands();
                    break;
                case 'events':
                    Tools.uncacheTree('../classes/events.js');
                    require('../classes/events.js')
                    break;
                case 'shop':
                    Tools.uncacheTree('../classes/shop.js');
                    require('../classes/shop.js')
                    break;
                default:
                    interaction.reply("Invalid module.");
                    interaction.reply(`Valid modules are: ${validModules.join(', ')}`);
                    return false;
            }
            interaction.reply(`Reloaded module: ${module}`);
        }
    }
};
exports.commands = commands;
