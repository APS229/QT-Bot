'use strict';

const fs = require('fs');
const validColors = [
    'DEFAULT',
    'AQUA',
    'GREEN',
    'BLUE',
    'PURPLE',
    'LUMINOUS_VIVID_PINK',
    'GOLD',
    'ORANGE',
    'RED',
    'GREY',
    'DARKER_GREY',
    'NAVY',
    'DARK_AQUA',
    'DARK_GREEN',
    'DARK_BLUE',
    'DARK_PURPLE',
    'DARK_VIVID_PINK',
    'DARK_GOLD',
    'DARK_ORANGE',
    'DARK_RED',
    'DARK_GREY',
    'LIGHT_GREY',
    'DARK_NAVY',
    'RANDOM',
];

const commands = {
    pick: {
        usage: ['.pick'],
        target: true,
        desc: 'Randomly picks a choice from the given choices.',
        execute(target, channel, user, server, client) {
            target = target.split(',').map(choice => choice.trim());
            channel.say(`Random pick: ${target.random()}`);
        }
    },
    roll: {
        target: true,
        usage: ['.roll [number]'],
        aliases: ['dice'],
        desc: 'Rolls a number between 1 to the given number.',
        execute(target, channel, user, server, client) {
            if (target.match(/[^\d\sdHL+-]/i)) return;

            let maxDice = 40;

            let diceQuantity = 1;
            let diceDataStart = target.indexOf('d');
            if (diceDataStart >= 0) {
                if (diceDataStart) diceQuantity = Number(target.slice(0, diceDataStart));
                target = target.slice(diceDataStart + 1);
                if (!Number.isInteger(diceQuantity) || diceQuantity <= 0 || diceQuantity > maxDice) return channel.say(`The amount of dice rolled should be a natural number up to ${maxDice}.`);
            }
            let offset = 0;
            let removeOutlier = 0;

            let modifierData = target.match(/[+-]/);
            if (modifierData) {
                switch (target.slice(modifierData.index).trim().toLowerCase()) {
                    case '-l':
                        removeOutlier = -1;
                        break;
                    case '-h':
                        removeOutlier = +1;
                        break;
                    default:
                        offset = Number(target.slice(modifierData.index));
                        if (isNaN(offset)) return;
                        if (!Number.isSafeInteger(offset)) return channel.say(`The specified offset must be an integer up to ${Number.MAX_SAFE_INTEGER}.`);
                }
                if (removeOutlier && diceQuantity <= 1) return channel.say(`More than one dice should be rolled before removing outliers.`);
                target = target.slice(0, modifierData.index);
            }

            let diceFaces = 6;
            if (target.length) {
                diceFaces = Number(target);
                if (!Number.isSafeInteger(diceFaces) || diceFaces <= 0) {
                    return channel.say(`The dice must have a natural amount of faces up to ${Number.MAX_SAFE_INTEGER}.`);
                }
            }

            if (diceQuantity > 1) {
                if (!Number.isSafeInteger(offset < 0 ? diceQuantity * diceFaces : diceQuantity * diceFaces + offset)) {
                    return channel.say(`The maximum sum of the dice must be lower or equal than ${Number.MAX_SAFE_INTEGER}.`);
                }
            }

            let maxRoll = 0;
            let minRoll = Number.MAX_SAFE_INTEGER;

            let trackRolls = diceQuantity * (('' + diceFaces).length + 1) <= 60;
            let rolls = [];
            let rollSum = 0;

            for (let i = 0; i < diceQuantity; ++i) {
                let curRoll = Math.floor(Math.random() * diceFaces) + 1;
                rollSum += curRoll;
                if (curRoll > maxRoll) maxRoll = curRoll;
                if (curRoll < minRoll) minRoll = curRoll;
                if (trackRolls) rolls.push(curRoll);
            }

            if (removeOutlier > 0) {
                rollSum -= maxRoll;
            } else if (removeOutlier < 0) {
                rollSum -= minRoll;
            }
            if (offset) rollSum += offset;

            let offsetFragment = '';
            if (offset) offsetFragment += (offset > 0 ? ' + ' + offset : offset);

            if (diceQuantity === 1) return channel.say(`Rolling (1 to ${diceFaces})${offsetFragment}: ${rollSum}`);

            const outlierFragment = removeOutlier ? ` except ${removeOutlier > 0 ? 'highest' : 'lowest'}` : ``;
            const rollsFragment = trackRolls ? ": " + rolls.join(', ') : "";
            return channel.say(
                `${diceQuantity} rolls (1 to ${diceFaces})${rollsFragment}\n` +
                `Sum${offsetFragment}${outlierFragment}: ${rollSum}`
            );
        }
    },
    // color: {
    // 	usage: ['.color [hex]'],
    // 	server: true,
    // 	target: true,
    // 	desc: 'Sets a color for your username.',
    // 	async execute(target, channel, user, server, client) {
    // 		const member = server.members.find(m => m.user === user);
    // 		if (!target) return channel.say(`Your color's hex code is: ${member.displayHexColor}`);
    // 		const con = validColors.includes(target.toUpperCase());
    // 		if ((!target.startsWith('#') || target.length !== 7) && !con) return channel.say("The color should be in hex value or a valid color. (Do .validcolors to see the list)");
    // 		let role = member.roles.find(r => r.name.endsWith('id'));
    // 		if (!role) {
    // 			role = await server.createRole({name: member.displayName + `'s id`});
    // 			member.addRole(role);
    // 		}
    // 		role.setColor(con ? target.toUpperCase() : target);
    // 		channel.say(`Your color has been set to: ${target.toLowerCase()}!`);
    // 	}
    // },
    validcolors: {
        usage: ['.validcolors'],
        desc: 'Shows the valid colors list.',
        execute(target, channel, user, server, client) {
            channel.say(`Valid colors: ${validColors.join(', ')}`);
        }
    },
    remindme: {
        usage: ['.remindme message, h/m/s, time'],
        target: true,
        desc: "Gives you a reminder of your message in given time.",
        execute(target, channel, user, server, client) {
            target = target.split(',').map(t => t.trim());
            let time = target[2], type = target[1].toLowerCase();
            let ori = time;
            switch (type) {
                case 'h':
                    if (time > 1) return channel.say("The reminder timer must not be more than an hour.");
                    time = time * 1000 * 60 * 60;
                    type = "hours";
                    break;
                case 'm':
                    if (time > 60) return channel.say("The reminder timer must not be more than an hour.");
                    time = time * 1000 * 60;
                    type = "minutes";
                    break;
                case 's':
                    if (time > 60 * 60) channel.say("The reminder timer must not be more than an hour.");
                    time *= 1000;
                    type = "seconds";
                    break;
                default:
                    return channel.say("Invalid unit of time.");
            }

            channel.say(`Reminder set for ${ori} ${type}.`);
            setTimeout(() => {
                const ch = server.channels.cache.find(ch => ch.name === 'bot-commands');
                ch.say(`<@${user.id}> Your reminder: ${target[0]}`);
            }, time);
        }
    },
    randomcat: {
        usage: ['.randomcat'],
        desc: "Shows a picture of a random cat.",
        aliases: ['randcat'],
        execute(target, channel, user, server, client) {
            require('request')('https://api.thecatapi.com/v1/images/search', (error, response, body) => {
                if (error) return console.log("Error in command randomcat: " + error);
                const cat = `${JSON.parse(body)[0].url}`;
                channel.send({ files: [cat] });
            });
        }
    },
    randomdog: {
        usage: ['.randomdog'],
        desc: "Shows a picture of a random dog.",
        aliases: ['randdog'],
        execute(target, channel, user, server, client) {
            require('request')('https://dog.ceo/api/breeds/image/random', (error, response, body) => {
                if (error) return console.log("Error in command randomdog: " + error);
                const dog = `${JSON.parse(body).message}`;
                channel.send({ files: [dog] });
            });
        }
    }
};
exports.commands = commands;
