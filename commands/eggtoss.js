'use strict';

const commands = {
	// egg: {
	// 	desc: 'Starts a game of Egg Toss.',
	// 	usage: ['.egg [user]'],
	// 	target: true,
	// 	execute(target, channel, user, server, client) {
	// 		if (channel.game && channel.game.id === 'eggtoss') return Client.commands.get('pass').execute(target, channel, user, server, client);
	// 		const Eggtoss = Client.games.get('eggtoss');
	// 		channel.game = new Eggtoss(Tools.toId(target), channel, client);
	// 	}
	// },
	// pass: {
	// 	aliases: ['.toss'],
	// 	target: true,
	// 	execute(target, channel, user, server, client) {
	// 		if (!channel.game) return;
	// 		if (!client.mentions.users.first()) return;
	// 		channel.game.pass(client);
	// 	}
	// }
};
exports.commands = commands;
