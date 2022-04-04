'use strict';

const commands = {
    uno: {
        desc: 'Creates a new game of UNO.',
        usage: ['.uno'],
        mod: true,
        server: true,
        execute(target, channel, user, server, client) {
            if (Client.activeGame) return channel.say(`There's already a game of ${Client.activeGame.name} going on.`)
            const UNO = Client.games.get('uno');
            Client.activeGame = new UNO(channel, server);
        }
    },
    join: {
        desc: 'Makes you join the game of UNO.',
        usage: ['.join'],
        execute(target, channel, user, server, client) {
            if (!Client.activeGame || Client.activeGame.name !== 'UNO' || Client.activeGame.started) return;
            if (Client.activeGame.players.has(user.id)) return;
            Client.activeGame.players.set(user.id, []);
            user.send("You have joined the game of UNO!").catch(() => {});
        }
    },
    leave: {
        desc: 'Makes you leave the game of UNO.',
        usage: ['.leave'],
        execute(target, channel, user, server, client) {
            if (!Client.activeGame || Client.activeGame.name !== 'UNO' || !Client.activeGame.started) return;
            if (!Client.activeGame.players.has(user.id)) return user.say("You are not in the current game of UNO.");
            Client.activeGame.disqualify([user.id]);
            user.send("You have left the game of UNO!").catch(() => {});
        }
    },
    end: {
        desc: 'Ends the game of UNO.',
        usage: ['.end'],
        mod: true,
        execute(target, channel, user, server, client) {
            if (!Client.activeGame) return;
            Client.activeGame.onEnd();
        }
    },
    start: {
        desc: 'Starts the game of UNO',
        usage: ['.start'],
        mod: true,
        execute(target, channel, user, server, client) {
            if (!Client.activeGame) return;
            if (Client.activeGame.started) return channel.say("The game has already been started!");
            Client.activeGame.onStart();
        }
    },
    play: {
        desc: 'Play a card in UNO.',
        usage: ['.play [card]'],
        target: true,
        server: true,
        execute(target, channel, user, server, client) {
            if (!Client.activeGame) return;
            Client.activeGame.play(user.id, target);
        }
    },
    players: {
        desc: 'Shows the list of players in UNO.',
        usage: ['.players'],
        aliases: ['pl'],
        server: true,
        execute(target, channel, user, server, client) {
            if (!Client.activeGame) return;
            Client.activeGame.showPlayers();
        }
    },
    disqualify: {
        desc: 'Disqualifies the specified player from the game',
        usage: ['.disqualify @player'],
        aliases: ['dq'],
        server: true,
        mod: true,
        execute(target, channel, user, server, client) {
            if (!Client.activeGame || Client.activeGame.name !== 'UNO' || !Client.activeGame.started) return;
            Client.activeGame.disqualify(Array.from(client.mentions.users.keys()));
        }
    }
}

exports.commands = commands;
