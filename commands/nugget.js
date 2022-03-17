'use strict';

const commands = {
	nugget: {
		desc: 'Starts a game of Egg Toss.',
		usage: ['.egg [user]'],
        aliases: ['nugg'],
		target: true,
		execute(target, channel, user, server, client) {
            if (!client.mentions.users.first()) return channel.say("Mention a user, you nugget.");
			if (channel.game?.id === 'nugget') return Client.commands.get('pass').execute(target, channel, user, server, client);
			const Nugget = Client.games.get('nugget');
			channel.game = new Nugget(channel, client);
		}
	},
	pass: {
		aliases: ['toss'],
		target: true,
		execute(target, channel, user, server, client) {
			if (!channel.game) return;
			if (!client.mentions.users.first()) return;
			channel.game.pass(client);
		}
	}
};
exports.commands = commands;
