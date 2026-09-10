'use strict';

const { ApplicationCommandOptionType } = require('discord.js');

const commands = {
    alias: {
        description: "Pick an alias in the game of Empires.",
        slashCommand: true,
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: 'alias',
                description: "Alias for the game of Empires. (3 to 15 characters)",
                required: true
            }
        ],
        execute(interaction) {
            if (interaction.content) return interaction.reply("Your alias must be anonymous, please use the slash command.");
            if (Client.activeGame?.id !== 'empires') return interaction.reply({ content: "No game of Empires is going on right now.", flags: 'Ephemeral' });
            if (!Client.activeGame.started) return interaction.reply({ content: "The game must start before choosing aliases.", flags: 'Ephemeral' });
            if (!Client.activeGame.players.has(interaction.member.id)) return interaction.reply({ content: "You are not in the current game of Empires.", flags: 'Ephemeral' });
            if (!Client.activeGame.canSetAlias) return interaction.reply({ content: "You cannot change your alias now.", flags: 'Ephemeral' });

            const alias = Tools.toId(interaction.options.get('alias').value);
            if ([...Client.activeGame.aliases.values()].includes(alias)) return interaction.reply({ content: "Somebody else has already picked that alias, please choose another.", flags: 'Ephemeral' });
            if (alias.length > 16 || alias.length < 3) return interaction.reply({ content: "Alias must be longer than 2 characters and shorter than 16 characters.", flags: 'Ephemeral' });

            Client.activeGame.setAlias(interaction.member.id, alias);
            interaction.reply({ content: `Your alias has been set to: ${alias}`, flags: 'Ephemeral' });
        }
    },
    guessalias: {
        description: "Guess a player's alias in the game of Empires.",
        execute(interaction, target) {
            if (Client.activeGame?.id !== 'empires') return interaction.reply("No game of Empires is going on right now.");
            if (!Client.activeGame.started) return interaction.reply("The game has not started yet.");
            if (!Client.activeGame.players.has(interaction.member.id)) return interaction.reply("You are not in the current game of Empires.");
            if (Client.activeGame.turn !== interaction.member.id) return interaction.reply("It's not your turn.");

            const playerId = interaction.mentions.users.first()?.id;
            const alias = Tools.toId(target.split(' ')[1]);

            if (!Client.activeGame.players.has(playerId)) return interaction.reply("The user you specified is not in the current game.");
            if (interaction.member.id === playerId) return interaction.reply("You cannot guess your own self...");
            if (![...Client.activeGame.aliases.values()].includes(alias)) return interaction.reply(`Not an alias!\nAliases: ${Tools.joinList([...Client.activeGame.aliases.values()])}`);
            Client.activeGame.onGuess(interaction.member.id, { playerId, alias });
        }
    }
};

exports.commands = commands;