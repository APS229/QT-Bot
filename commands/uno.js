'use strict';

const commands = {
    uno: {
        desc: 'Creates a new game of UNO.',
        usage: ['.uno'],
        mod: true,
        server: true,
        execute(target, channel, user, server, client) {
            if (channel.game) return channel.say(`There's already a game of ${channel.game.name} going on.`)
            const UNO = Client.games.get('uno');
            channel.game = new UNO(channel, server);
        }
    },
    join: {
        desc: 'Makes you join the game of UNO.',
        usage: ['.join'],
        execute(target, channel, user, server, client) {
            if (!channel.game || channel.game.name !== 'UNO') return;
            if (channel.game.players.has(user.id)) return;
            channel.game.players.set(user.id, []);
            user.send("You have joined the game of UNO!").catch(() => {});
        }
    },
    leave: {
        desc: 'Makes you leave the game of UNO.',
        usage: ['.leave'],
        execute(target, channel, user, server, client) {
            if (!channel.game || channel.game.name !== 'UNO') return;
            if (!channel.game.players.has(server.members.cache.find(m => m.user === user))) return user.say("You are not in the current game of UNO.");
            channel.game.players.delete(server.members.cache.find(m => m.user === user));
            user.send("You have left the game of UNO!").catch(() => {});
        }
    },
    end: {
        desc: 'Ends the game of UNO.',
        usage: ['.end'],
        mod: true,
        execute(target, channel, user, server, client) {
            if (!channel.game) return;
            channel.game.onEnd();
        }
    },
    start: {
        desc: 'Starts the game of UNO',
        usage: ['.start'],
        mod: true,
        execute(target, channel, user, server, client) {
            if (!channel.game) return;
            if (channel.game.started) return channel.say("The game has already been started!");
            channel.game.onStart();
        }
    },
    play: {
        desc: 'Play a card in UNO.',
        usage: ['.play [card]'],
        target: true,
        server: true,
        execute(target, channel, user, server, client) {
            const ch = server.channels.cache.find(ch => ch.game && ch.game.id === 'uno');
            if (!ch) return;
            ch.game.play(user.id, target);
        }
    },
    hand: {
        desc: 'Shows your hand in UNO.',
        usage: ['.hand'],
        server: true,
        execute(target, channel, user, server, client) {
            const ch = server.channels.cache.find(ch => ch.game && ch.game.id === 'uno');
            if (!ch) return;
            ch.game.showHand(user.id);
        }
    },
    draw: {
        desc: 'Draws a card in UNO.',
        usage: ['.draw'],
        server: true,
        execute(target, channel, user, server, client) {
            const ch = server.channels.cache.find(ch => ch.game && ch.game.id === 'uno');
            if (!ch) return;
            ch.game.draw(user.id);
        }
    },
    players: {
        desc: 'Shows the list of players in UNO.',
        usage: ['.players'],
        aliases: ['pl'],
        server: true,
        execute(target, channel, user, server, client) {
            const ch = server.channels.cache.find(ch => ch.game && ch.game.id === 'uno');
            if (!ch) return;
            ch.game.showPlayers();
        }
    },
    disqualify: {
        desc: 'Disqualifies the specified player from the game',
        usage: ['.disqualify @player'],
        aliases: ['dq'],
        server: true,
        mod: true,
        execute(target, channel, user, server, client) {
            if (!channel.game || channel.game.name !== 'UNO' || !channel.game.started) return;
            channel.game.disqualify(Array.from(client.mentions.users.keys()));
        }
    }
}

exports.commands = commands;
