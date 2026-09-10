'use strict';

const { ApplicationCommandOptionType } = require('discord.js');
const commands = {
    choosedoor: {
        description: "Choose a door in the game of Trick House.",
        slashCommand: true,
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: 'door',
                description: "Door to pick in the game of Trick House.",
                required: true
            }
        ],
        execute(interaction) {
            if (interaction.content) return interaction.reply("Your choice must be anonymous, please use the slash command.");
            if (Client.activeGame?.id !== 'trickhouse') return interaction.reply({ content: "No game of Trick House is going on right now.", flags: 'Ephemeral' });
            if (!Client.activeGame.players.has(interaction.member.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}.`, flags: 'Ephemeral' });
            if (!Client.activeGame.canGuess) return interaction.reply({ content: "Please wait until next round starts.", flags: 'Ephemeral' });

            const door = Tools.toId(interaction.options.get('door').value);
            if (!Client.activeGame.doorsId.includes(door)) return interaction.reply({ content: `Invalid choice! Current doors are: ${Tools.joinList(Client.activeGame.doors)}`, flags: 'Ephemeral' });
            if (Client.activeGame.players.get(interaction.member.id).choice) return interaction.reply({ content: "You have already picked a door!", flags: 'Ephemeral' });
            if (Client.activeGame.players.size === 2) {
                const doorChosen = [...Client.activeGame.players.values()].find(playerData => playerData.choice === door);
                if (doorChosen) return interaction.reply({ content: "Someone else has already picked that door! Please choose another.", flags: 'Ephemeral' });
            }
            Client.activeGame.onGuess(interaction.member.id, door);
            interaction.reply({ content: `You have chosen the door: ${Client.activeGame.doors[Client.activeGame.doorsId.indexOf(door)]}`, flags: 'Ephemeral' });
        }
    },
};

exports.commands = commands;