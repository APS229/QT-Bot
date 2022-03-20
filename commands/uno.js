'use strict';

const commands = {
    // uno: {
    //     desc: 'Creates a new game of UNO.',
    //     usage: ['.uno'],
    //     mod: true,
    //     server: true,
    //     execute(target, channel, user, server, client) {
    //         if (channel.game) return channel.say(`There's already a game of ${channel.game.name} going on.`)
    //         const UNO = Client.games.get('uno');
    //         channel.game = new UNO(channel);
    //     }
    // },
    // join: {
    //     desc: 'Makes you join the game of UNO.',
    //     usage: ['.join'],
    //     execute(target, channel, user, server, client) {
    //         if (!channel.game || channel.game.name !== 'UNO') return;
    //         if (channel.game.players.has(server.members.cache.find(m => m.user === user))) return;
    //         channel.game.players.set(server.members.cache.find(m => m.user === user), []);
    //         user.say("You have joined the game of UNO!");
    //     }
    // },
    // leave: {
    //     desc: 'Makes you leave the game of UNO.',
    //     usage: ['.leave'],
    //     execute(target, channel, user, server, client) {
    //         if (!channel.game || channel.game.name !== 'UNO') return;
    //         if (!channel.game.players.has(server.members.cache.find(m => m.user === user))) return user.say("You are not in the current game of UNO.");
    //         channel.game.players.delete(server.members.cache.find(m => m.user === user));
    //         user.say("You have left the game of UNO!");
    //     }
    // },
    // end: {
    //     desc: 'Ends the game of UNO.',
    //     usage: ['.end'],
    //     mod: true,
    //     execute(target, channel, user, server, client) {
    //         if (!channel.game) return;
    //         channel.game.onEnd();
    //     }
    // },
    // start: {
    //     desc: 'Starts the game of UNO',
    //     usage: ['.start'],
    //     mod: true,
    //     execute(target, channel, user, server, client) {
    //         if (!channel.game) return;
    //         if (channel.game.started) return channel.say("The game has already been started!");
    //         channel.game.onStart();
    //     }
    // },
    // play: {
    //     desc: 'Play a card in UNO.',
    //     usage: ['.play [card]'],
    //     target: true,
    //     server: true,
    //     execute(target, channel, user, server, client) {
    //         const ch = server.channels.cache.find(ch => ch.game && ch.game.id === 'uno');
    //         if (!ch) return;
    //         ch.game.play(server.members.cache.find(m => m.user === user), target);
    //     }
    // },
    // hand: {
    //     desc: 'Shows your hand in UNO.',
    //     usage: ['.hand'],
    //     server: true,
    //     execute(target, channel, user, server, client) {
    //         const ch = server.channels.cache.find(ch => ch.game && ch.game.id === 'uno');
    //         if (!ch) return;
    //         ch.game.showHand(server.members.cache.find(m => m.user === user));
    //     }
    // },
    // draw: {
    //     desc: 'Draws a card in UNO.',
    //     usage: ['.draw'],
    //     server: true,
    //     execute(target, channel, user, server, client) {
    //         const ch = server.channels.cache.find(ch => ch.game && ch.game.id === 'uno');
    //         if (!ch) return;
    //         ch.game.draw(server.members.cache.find(m => m.user === user));
    //     }
    // },
    // players: {
    //     desc: 'Shows the list of players in UNO.',
    //     usage: ['.players'],
    //     aliases: ['pl'],
    //     server: true,
    //     execute(target, channel, user, server, client) {
    //         const ch = server.channels.cache.find(ch => ch.game && ch.game.id === 'uno');
    //         if (!ch) return;
    //         ch.game.showPlayers();
    //     }
    // }
    // disqualify: {
    //   desc: 'Disqualifies the specified player from the game',
    //   usage: ['.disqualify @player'],
    //   aliases: ['dq'],
    //   server: true,
    //   mod: true,
    //   execute(target, channel, user, server, client) {
    //     if (!channel.game || channel.game.name !== 'UNO') return;
    //     for (const u of channel.lastMessage.mentions.users.size) {
    //       channel.game.players.delete(server.members.cache.find(m => m.user === u));
    //       channel.game.queue.delete(server.members.cahce.find(m => m.user === u));
    //     }
    //   }
    // }
}

exports.commands = commands;
