'use strict';

const commands = {
    uno: {
        description: "Declare UNO! in the game of UNO.",
        execute(interaction) {
            if (Client.activeGame?.id !== 'uno') return interaction.reply({ content: "No game of UNO is going on right now.", flags: 'Ephemeral' });
            if (!Client.activeGame?.players.has(interaction.member.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}.`, flags: 'Ephemeral' });
            if (!Client.activeGame.started) return interaction.reply({ content: "The game hasn't started yet.", flags: 'Ephemeral' });
            Client.activeGame.declareUno(interaction);
        }
    },
    play: {
        description: "Play a card in the game of UNO.",
        execute(interaction) {
            if (Client.activeGame?.id !== 'uno') return interaction.reply({ content: "No game of UNO is going on right now.", flags: 'Ephemeral' });
            if (!Client.activeGame?.players.has(interaction.member.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}.`, flags: 'Ephemeral' });
            if (!Client.activeGame.started) return interaction.reply({ content: "The game hasn't started yet.", flags: 'Ephemeral' });
            if (interaction.member.id !== Client.activeGame.queue[0]) return interaction.reply({ content: "It is currently not your turn!", flags: 'Ephemeral' });
            Client.activeGame.play(interaction);
        }
    },
    draw: {
        description: "Draw a card in the game of UNO.",
        execute(interaction) {
            if (Client.activeGame?.id !== 'uno') return interaction.reply({ content: "No game of UNO is going on right now.", flags: 'Ephemeral' });
            if (!Client.activeGame?.players.has(interaction.member.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}.`, flags: 'Ephemeral' });
            if (!Client.activeGame.started) return interaction.reply({ content: "The game hasn't started yet.", flags: 'Ephemeral' });
            if (interaction.member.id !== Client.activeGame.queue[0]) return interaction.reply({ content: "It is currently not your turn!", flags: 'Ephemeral' });
            Client.activeGame.draw(interaction);
        }
    },
    hand: {
        description: "View your hand of cards in the game of UNO.",
        execute(interaction) {
            if (Client.activeGame?.id !== 'uno') return interaction.reply({ content: "No game of UNO is going on right now.", flags: 'Ephemeral' });
            if (!Client.activeGame?.players.has(interaction.member.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}.`, flags: 'Ephemeral' });
            if (!Client.activeGame.started) return interaction.reply({ content: "The game hasn't started yet.", flags: 'Ephemeral' });
            if (interaction.content) return interaction.reply("You can only view your hand using Hand button or the slash command.");
            Client.activeGame.showHand(interaction);
        }
    },
};

// exports.commands = commands;