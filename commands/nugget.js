'use strict';

const commands = {
    nugget: {
        desc: 'Starts a game of Nugget.',
        usage: ['.egg [user]'],
        aliases: ['nugg'],
        target: true,
        async execute(target, channel, user, server, client) {
            if (channel.game && channel.game.id !== 'nugget') return channel.say(`There's already a game of ${channel.game.name} going on in this channel.`);
            const toUser = client.mentions.users.first();
            if (!toUser) return channel.say("Mention a user, you nugget.");
            if (toUser.id === user.id) return channel.say("Imagine trying to nugget yourself.");
            if (toUser.bot) return channel.say("You can't nugget a bot, bruh.");
            const member = await server.members.fetch(user.id);
            const toMember = await server.members.fetch(toUser.id);
            if (member?.presence?.status === 'dnd' || member?.presence?.status === 'offline') return channel.say("You can't nugget anyone while you're set to DnD or offline.");
            if (toMember?.presence?.status === 'dnd' || toMember?.presence?.status === 'offline') return channel.say("You can't nugget that user. (DnD/offline)");
            if (channel.game?.id === 'nugget') return Client.commands.get('pass').execute(target, channel, user, server, client);
            const Nugget = Client.games.get('nugget');
            channel.game = new Nugget(user, channel, client);
        }
    },
    pass: {
        aliases: ['toss'],
        target: true,
        async execute(target, channel, user, server, client) {
            if (!channel.game) return;
            const toUser = client.mentions.users.first();
            if (!toUser) return;
            if (toUser.id === user.id) return channel.say("Imagine trying to pass the nugget to yourself.");
            const toMember = await server.members.fetch(toUser.id);
            if ((toMember?.presence?.status === 'dnd' || toMember?.presence?.status === 'offline') && channel.game.before.id !== toUser.id) return channel.say("You can't pass the nugget to that user. (DnD/offline)");
            channel.game.pass(client);
        }
    }
};
exports.commands = commands;
