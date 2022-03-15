'use strict';

const fs = require('fs');

const commands = {
    kill: {
        devOnly: true,
        hidden: true,
        aliases: ['reset', 'restart', 'die'],
        execute(target, channel, user, server, client) {
            channel.say("Shutting down...");
            setTimeout(() => {
                process.exit();
            }, 500);
        }
    },
    js: {
        devOnly: true,
        hidden: true,
        target: true,
        aliases: ['eval'],
        clean(text) {
            if (typeof text === 'string') text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203));
            return text;
        },
        execute(target, channel, user, server, client) {
            try {
                let evaled = eval(target);
                if (typeof evaled !== 'string') evaled = require('util').inspect(evaled);

                channel.say(`\`\`\`${this.clean(evaled)}\`\`\``, { code: "xl" });
            } catch (err) {
                channel.say(this.clean(err.stack));
            }
        }
    },
    disable: {
        devOnly: true,
        hidden: true,
        execute(target, channel, user, server, client) {
            Client.disabled = true;
            channel.say("Commands has been disabled.");
        }
    },
    enable: {
        devOnly: true,
        hidden: true,
        execute(target, channel, user, server, client) {
            Client.disabled = false;
            channel.say("Commands has been enabled.");
        }
    },
    reload: {
        devOnly: true,
        hidden: true,
        execute(target, channel, user, server, client) {
            const validModules = ['config', 'games', 'tools', 'commands', 'events', 'shop', 'database'];
            const module = Tools.toId(target);
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
                case 'database':
                    const database = fs.readdirSync('./database/');
                    for (const databaseFile of database) {
                        const file = JSON.parse(fs.readFileSync('./database/' + databaseFile));
                        console.log(file);
                        fs.writeFileSync('./database/' + databaseFile, JSON.stringify(file, null, 4))
                    }
                    break;
                default:
                    channel.say("Invalid module.");
                    channel.say(`Valid modules are: ${validModules.join(', ')}`);
                    return false;
                    break;
            }
            channel.say(`Reloaded module: ${module}`)
        }
    },
    masskick: {
        devOnly: true,
        hidden: true,
        async execute(target, channel, user, server, client) {
            const members = await server.members.fetch();
            members.forEach(member => {
                if (member.roles.cache.has('875395095472504853')) {
                    member.kick("Inactivity");
                    console.log(`${member.user.username} has been kicked.`);
                }
            });
        }
    }
};
exports.commands = commands;
