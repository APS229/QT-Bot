'use strict';

const commands = {
    squareroot: {
        usage: ['.root [number]'],
        aliases: ['root'],
        desc: 'Returns the root of the number given.',
        target: true,
        execute(target, channel, user, server, client) {
            const num = parseFloat(target);
            if (!num) return channel.say("Invalid number.");
            const root = Math.sqrt(num);
            channel.say(`The square root of number ${num} is ${root}.`);
        }
    },
    square: {
        usage: ['.square [number]'],
        desc: 'Returns the square of the given number.',
        target: true,
        execute(target, channel, user, server, client) {
            const num = parseFloat(target);
            if (!num) return channel.say("Invalid number.");
            const sqr = num * num;
            channel.say(`The square of number ${num} is ${sqr}.`);
        }
    },
    cube: {
        usage: ['.cube [number]'],
        desc: 'Gives the cube of the number given.',
        target: true,
        execute(target, channel, user, server, client) {
            const num = parseFloat(target);
            if (!num) return channel.say("Invalid number.");
            const cube = num * num * num;
            channel.say(`The cube of number ${num} is ${cube}.`);
        }
    }
};
exports.commands = commands;
