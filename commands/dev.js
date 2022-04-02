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
            channel.say("Commands have been disabled.");
        }
    },
    enable: {
        devOnly: true,
        hidden: true,
        execute(target, channel, user, server, client) {
            Client.disabled = false;
            channel.say("Commands have been enabled.");
        }
    },
    reload: {
        devOnly: true,
        hidden: true,
        execute(target, channel, user, server, client) {
            const validModules = ['config', 'games', 'tools', 'commands', 'events'];
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
                default:
                    channel.say("Invalid module.");
                    channel.say(`Valid modules are: ${validModules.join(', ')}`);
                    return false;
                    break;
            }
            channel.say(`Reloaded module: ${module}`)
        }
    },
    test: {
        devOnly: true,
        hidden: true,
        async execute(target, channel, user, server, client) {
            const { MessageActionRow, MessageButton, MessageAttachment } = Client.discord;
            const img = new MessageAttachment('./images/green.png');
            const embed = new Client.discord.MessageEmbed()
                .setColor('GREEN')
                .setTitle('UNO')
                .setThumbnail('attachment://green.png')
                .addField('__Top card__', ':green_circle: Green 0')
                .addField('__Players(3)__', 'WAF(``5``)\nLagertha(``1``)\n**APS(``3``)**')
                .addField('__Information__', `1) Click the Hand button or use the command \`\`/hand\`\` to check your cards.\n
                2) Click the UNO button or use the command \`\`/uno\`\` if you have 1 card left.\n
                3) Bully WAF 24/7.`)
                .setTimestamp()
                .setFooter({ text: Config.username, iconURL: Config.avatarURL });
            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('hand')
                        .setLabel('Hand')
                        .setStyle('PRIMARY'),
                    // new MessageButton()
                    //     .setCustomId('uno')
                    //     .setLabel('UNO')
                    //     .setStyle('SUCCESS')
                );
            const message = await channel.send({ content: `<@${user.id}>'s turn!`, embeds: [embed], components: [row], files: [img], ephemeral: true });
        }
    },
    masskick: {
        devOnly: true,
        hidden: true,
        async execute(target, channel, user, server, client) {
            channel.say("how many times you gonna masskick bruh");
        }
    }
};
exports.commands = commands;
