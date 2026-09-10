'use strict';

const { ApplicationCommandOptionType } = require('discord.js');

const commands = {
    hide: {
        description: "Choose a hiding spot in the game of Hide and Seek.",
        slashCommand: true,
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: 'spot',
                description: "Hiding spot to pick in the game of Hide and Seek.",
                required: true
            }
        ],
        execute(interaction) {
            if (interaction.content) return interaction.reply("Your hiding spot must be anonymous, please use the slash command.");
            if (Client.activeGame?.id !== 'hideandseek') return interaction.reply({ content: "No game of Hide and Seek is going on right now.", flags: 'Ephemeral' });
            if (!Client.activeGame.players.has(interaction.member.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}.`, flags: 'Ephemeral' });
            if (Client.activeGame.seeker === interaction.member.id) return interaction.reply({ content: "You are the seeker, you can't pick a hiding spot.", flags: 'Ephemeral' });
            if (!Client.activeGame.canHide) return interaction.reply({ content: "Please wait until next round starts.", flags: 'Ephemeral' });

            const spot = Tools.toId(interaction.options.get('spot').value);
            if (!Client.activeGame.choicesId.includes(spot)) return interaction.reply({ content: `Invalid choice! Current hiding spots are: ${Tools.joinList(Client.activeGame.choices)}`, flags: 'Ephemeral' });
            if (Client.activeGame.players.get(interaction.member.id).spot) return interaction.reply({ content: "You have already picked a hiding spot!", flags: 'Ephemeral' });
            Client.activeGame.onHide(interaction.member.id, spot);
            interaction.reply({ content: `Your spot is: ${Client.activeGame.choices[Client.activeGame.choicesId.indexOf(spot)]}`, flags: 'Ephemeral' });
        }
    },
    seek: {
        description: "Choose a Seeking spot in the game of Hide and Seek.",
        execute(interaction, target) {
            if (Client.activeGame?.id !== 'hideandseek') return interaction.reply("No game of Hide and Seek is going on right now.");
            if (!Client.activeGame.players.has(interaction.member.id)) return interaction.reply(`You are not in the current game of ${Client.activeGame.name}.`);
            if (Client.activeGame.seeker !== interaction.member.id) return interaction.reply("You are not the seeker. Please use the ``/hide`` command if you're a hider.");
            if (!Client.activeGame.canSeek) return interaction.reply("Please wait for the hiders to hide first.");

            const spot = Tools.toId(target);
            if (!Client.activeGame.choicesId.includes(spot)) return interaction.reply(`Invalid choice! Current hiding spots are: ${Tools.joinList(Client.activeGame.choices)}`);
            Client.activeGame.onSeek(spot);
        }
    }
};

exports.commands = commands;