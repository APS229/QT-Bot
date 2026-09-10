'use strict';

const commands = {
    buy: {
        description: "Buy a property in the game of Monopoly.",
        execute(interaction) {
            if (Client.activeGame?.id !== 'monopoly') return interaction.reply({ content: "No game of Monopoly is going on right now.", flags: 'Ephemeral' });
            if (!Client.activeGame?.players.has(interaction.member.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}.`, flags: 'Ephemeral' });
            if (interaction.member.id !== Client.activeGame.queue[0]) return interaction.reply({ content: "It is currently not your turn!", flags: 'Ephemeral' });
            if (!Client.activeGame.canBuy) return interaction.reply({ content: "There is nothing you can buy right now.", flags: 'Ephemeral' });
            Client.activeGame.onBuy(interaction);
        }
    },
    bail: {
        description: "Bail out of Jail in the game of Monopoly.",
        async execute(interaction) {
            if (Client.activeGame?.id !== 'monopoly') return interaction.reply({ content: "No game of Monopoly is going on right now.", flags: 'Ephemeral' });
            if (!Client.activeGame?.players.has(interaction.member.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}.`, flags: 'Ephemeral' });
            if (interaction.member.id !== Client.activeGame.queue[0]) return interaction.reply({ content: "It is currently not your turn!", flags: 'Ephemeral' });
            if (!Client.activeGame.players.get(interaction.member.id).inJail) return interaction.reply({ content: "You are not in **Jail** \\⛓️.", flags: 'Ephemeral' });
            if (!Client.activeGame.canBail) return interaction.reply({ content: "You cannot bail out of **Jail** \\⛓️ right now.", flags: 'Ephemeral' });
            await interaction.reply(`<@${interaction.member.id}> bailed out of **Jail**!`);
            Client.activeGame.onResolveJail('bail');
        }
    },
    dice: {
        description: "Roll the dice to get out of Jail in the game of Monopoly.",
        async execute(interaction) {
            if (Client.activeGame?.id !== 'monopoly') return interaction.reply({ content: "No game of Monopoly is going on right now.", flags: 'Ephemeral' });
            if (!Client.activeGame?.players.has(interaction.member.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}.`, flags: 'Ephemeral' });
            if (interaction.member.id !== Client.activeGame.queue[0]) return interaction.reply({ content: "It is currently not your turn!", flags: 'Ephemeral' });
            if (!Client.activeGame.players.get(interaction.member.id).inJail) return interaction.reply({ content: "You are not in **Jail** \\⛓️.", flags: 'Ephemeral' });
            if (!Client.activeGame.canBail) return interaction.reply({ content: "You cannot roll the dice to try and get out of **Jail** \\⛓️ right now.", flags: 'Ephemeral' });
            await interaction.reply(`<@${interaction.member.id}> decided to roll the dice to try and get out of **Jail** \\⛓️!`);
            Client.activeGame.onResolveJail('dice');
        }
    },
};

exports.commands = commands;