'use strict';

const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

class Empires extends Games.Game {
    constructor(interaction) {
        super(interaction);
        this.name = "Empires";
        this.description = `- Don't tell others your alias, make it less obvious.\n
        - You will have 60 seconds to choose your alias using the \`/alias\` command before the game starts.\n
        - **On your turn only**, use \`/guessalias\` command to guess someone with an alias.\n
        - If correct, you will get to guess one more person.\n
        - If incorrect, the person you tried to guess will get a turn.\n
        - The one to survive until the end will be the winner.`;
        this.aliases = new Map();
        this.turn = null;
        this.requiredPlayers = 4;
        this.playerTime = 45;
        this.roundTime = 60;
        this.cooldownTime = 5;
        this.setAliases = false;
        this.guess = { userId: null, alias: null };
        this.selectMenusMessage = null;
        this.init();
    }
    async onStart() {
        super.onStart();
        await this.channel.send("Everyone go ahead and choose your alias with the `/alias` command, you have 60 seconds left.");
        this.roundTimer = setTimeout(() => {
            for (const player of this.players.keys()) {
                if (!this.aliases.has(player)) {
                    this.channel.send(`<@${player}> didn't choose an alias in time and has been eliminated.`);
                    this.onLeave(player);
                }
            }
            if (this.players.size < 2) {
                return this.onEnd();
            }
            this.turn = [...this.players.keys()].random();
            let randomized = [...this.aliases].shuffle();
            this.aliases = new Map(randomized);
            randomized = [...this.players].shuffle();
            this.players = new Map(randomized);
            this.setAliases = true;
            this.onNextRound();
        }, this.roundTime * 1000);
    }
    setAlias(userId, alias) {
        this.aliases.set(userId, alias);
    }
    async onNextRound() {
        if (this.playerTimer) clearTimeout(this.playerTimer);
        if (!await this.update()) return;
        if (!this.started) return;
        this.playerTimer = setTimeout(async () => {
            await this.channel.send(`<@${this.turn}> didn't respond in time and has been eliminated! Their alias was: ${this.aliases.get(this.turn)}`);
            if (!this.started) return;
            this.players.delete(this.turn);
            this.aliases.delete(this.turn);
            this.turn = [...this.players.keys()].random();
            if (this.players.size < 2) {
                this.winner = this.turn;
                return this.onEnd();
            }
            this.onNextRound();
        }, this.playerTime * 1000);
    }
    async handleSelectMenu(interaction) {
        if (interaction.message.id !== this.selectMenusMessage?.id) return interaction.reply({ content: "This menu has expired.", flags: 'Ephemeral' });
        this.onGuess(interaction, 'selectmenu');
    }
    async onGuess(interaction, interactionType) {
        if (this.turn !== interaction.member.id) return interaction.reply({ content: "It's not your turn.", flags: 'Ephemeral' });
        let userId = null, alias = null;
        if (interactionType === 'selectmenu') {
            // Expired menu
            if (interaction.message.id !== this.selectMenusMessage?.id) return interaction.reply({ content: "This menu has expired.", flags: 'Ephemeral' });
            interaction.customId === 'selectplayer' ? userId = interaction.values[0] : alias = interaction.values[0];

            const newComponents = [];
            for (const row of interaction.message.components) {
                const newRow = ActionRowBuilder.from(row);
                newComponents.push(newRow);
            }
            // Set the selected option and disable the select menu
            const currentRow = interaction.customId === 'selectplayer' ? newComponents[0] : newComponents[1];
            currentRow.components[0].options.find(option => option.data.value === interaction.values[0]).setDefault(true);
            currentRow.components[0].setDisabled(true);
            if (userId) this.guess.userId = userId;
            if (alias) this.guess.alias = alias;
            interaction.message.edit({ components: newComponents });
            if (!this.guess.userId || !this.guess.alias) return interaction.deferUpdate();
        }
        else {
            userId = interaction.options?._hoistedOptions[0].value || interaction.mentions.users.first()?.id;
            alias = Tools.toId(interaction.options?._hoistedOptions[1].value || interaction.content.split(' ')[2]);
            if (userId === interaction.member.id) return interaction.reply("You cannot guess your own self...");
            if (![...this.aliases.values()].includes(alias)) return interaction.reply("Not an alias.");
            if (!this.players.has(userId)) return interaction.reply("User not in game.");
            this.guess = { userId, alias };
            this.disableSelectMenus();
        }

        clearTimeout(this.playerTimer);
        if (this.aliases.get(this.guess.userId) === this.guess.alias) {
            await interaction.reply(`Correct! <@${this.guess.userId}> (${this.guess.alias}) has been eliminated.`);
            if (!this.started) return;
            clearTimeout(this.playerTimer);
            this.players.delete(this.guess.userId);
            this.aliases.delete(this.guess.userId);
            if (this.players.size < 2) {
                this.winner = interaction.member.id;
                return this.onEnd();
            }
            this.cooldownTimer = setTimeout(() => this.onNextRound(), this.cooldownTime * 1000);
        }
        else {
            await interaction.reply("Incorrect...");
            if (!this.started) return;
            clearTimeout(this.playerTimer);
            this.turn = this.guess.userId;
            this.cooldownTimer = setTimeout(() => this.onNextRound(), this.cooldownTime * 1000);
        }
        this.guess = {};
    }
    onLeave(userId) {
        super.onLeave(userId);
        if (this.aliases.has(userId)) {
            this.channel.send(`Their alias was: ${this.aliases.get(userId)}`);
            this.aliases.delete(userId);
        }
        if (this.players.size < 2 && this.setAliases) {
            this.winner = this.players.keys().next()?.value;
            return this.onEnd();
        }
    }
    async update() {
        if (!this.started) return;
        this.disableSelectMenus();
        const players = Tools.joinList([...this.players.keys()].map(id => `<@${id}>`)), aliases = Tools.joinList([...this.aliases.values()]);
        const embed = new EmbedBuilder()
            .setColor("#FFFFFF")
            .setTitle("Empires")
            .addFields({ name: "__Players__", value: players, inline: true })
            .addFields({ name: "__Aliases__", value: aliases, inline: true })
            .setTimestamp()
            .setFooter({
                text: Config.username,
                iconURL: Config.avatarURL
            });

        const playerOptions = [];
        for (const [playerId, playerTag] of this.players) {
            if (playerId === this.turn) continue;
            playerOptions.push(new StringSelectMenuOptionBuilder()
                .setLabel(playerTag)
                .setValue(playerId)
            );
        }
        const guessPlayerMenu = new StringSelectMenuBuilder()
            .setCustomId('selectplayer')
            .setPlaceholder("Select a player")
            .addOptions(playerOptions);

        const aliasOptions = [];
        for (const alias of this.aliases.values()) {
            aliasOptions.push(new StringSelectMenuOptionBuilder()
                .setLabel(alias)
                .setValue(alias)
            );
        }
        const guessAliasMenu = new StringSelectMenuBuilder()
            .setCustomId('selectalias')
            .setPlaceholder("Select an alias")
            .addOptions(aliasOptions);

        const guessPlayerMenuRow = new ActionRowBuilder().addComponents(guessPlayerMenu);
        const guessAliasMenuRow = new ActionRowBuilder().addComponents(guessAliasMenu);

        this.selectMenusMessage = await this.channel.send({ content: `<@${this.turn}>'s turn!`, embeds: [embed], components: [guessPlayerMenuRow, guessAliasMenuRow] });
        // Game still running
        if (this.started) return true;
    }
    disableSelectMenus() {
        if (this.selectMenusMessage) {
            const newComponents = [];
            for (const row of this.selectMenusMessage.components) {
                const newRow = ActionRowBuilder.from(row);
                newRow.components[0].setDisabled(true);
                newComponents.push(newRow);
            }
            this.selectMenusMessage.edit({ components: newComponents });
        }
    }
    onEnd() {
        this.disableSelectMenus();
        super.onEnd();
    }
}

exports.game = Empires;
exports.id = 'empires';