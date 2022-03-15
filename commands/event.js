'use strict';

const commands = {
    expleaderboard: {
        hidden: true,
        mod: true,
        aliases: ['xplb', 'explb'],
        async execute(target, channel, user, server, client) {
            let message = '';
            const users = Object.keys(Db('exp2').object()).sort((a, b) => b - a);
            const members = await server.members.fetch();
            for (let i = 0; i < users.length; i++) {
                const member = members.find(member => member.user.id === users[i]);
                const username = member ? member.user.username : users[i];
                message += `${username} - ${Db('exp2').get(users[i])}\n`;
            }
            if (message.length) channel.say('```' + message + '```');
        }
    }
};

exports.commands = commands;