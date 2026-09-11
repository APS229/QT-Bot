'use strict';

const { ActionRowBuilder, Collection, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

class Empires extends Games.Game {
    constructor(channel, host) {
        super(channel, host);
        this.name = "Empires";
        this.description = `- Don't tell others your alias, make it less obvious.\n
        - You will have 60 seconds to choose your alias using the \`/alias\` command before the game starts.\n
        - **On your turn only**, use \`.guessalias @player [alias]\` command to guess someone with an alias.\n
        - If correct, you will get to guess one more player's alias.\n
        - If incorrect, the person you tried to guess will get a turn.\n
        - The last player to survive will be the winner.`;
        this.aliases = new Collection();
        this.turn = null;
        this.requiredPlayers = 4;
        this.playerTime = 45;
        this.roundTime = 60;
        this.cooldownTime = 5;
        this.canSetAlias = false;
        this.selectMenusMessage = null;
    }
    async onStart() {
        super.onStart();
        await this.send(`Everyone go ahead and choose your alias with the \`/alias\` command, you have ${this.roundTime} seconds left.`);
        this.canSetAlias = true;
        this.roundTimer = setTimeout(() => this.setRoundTimer(), this.roundTime * 1000);
    }
    setRoundTimer() {
        for (const player of this.players.keys()) {
            if (!this.aliases.has(player)) {
                this.sendSync(`<@${player}> didn't choose an alias in time and has been eliminated.`);
                const ended = this.onLeave(player);
                if (ended) return;
            }
        }
        this.turn = this.players.randomKey();
        const randomOrder = [...this.aliases].shuffle();
        this.aliases = new Collection(randomOrder);
        this.canSetAlias = false;
        this.onNextRound();
    }
    onNextRound() {
        if (this.ended) return;
        if (this.playerTimer) clearTimeout(this.playerTimer);
        this.update();
        this.playerTimer = setTimeout(() => this.setPlayerTimer(), this.playerTime * 1000);
    }
    async setPlayerTimer() {
        try {
            await this.send(`<@${this.turn}> didn't respond in time and has been eliminated!`);
            const ended = this.onLeave(this.turn);
            if (ended) return;
            this.turn = [...this.players.keys()].random();
            this.onNextRound();
        }
        catch (err) {
            if (!(err instanceof GameEndedError)) {
                console.error(err);
            }
        }
    }
    setAlias(userId, alias) {
        if (!this.canSetAlias) return;
        this.aliases.set(userId, alias);
    }
    onGuess(userId, guess) {
        if (this.turn !== userId) return;

        clearTimeout(this.playerTimer);
        if (this.aliases.get(guess.playerId) === guess.alias) {
            this.sendSync(`Correct! <@${guess.playerId}> (${guess.alias}) has been eliminated.`);
            const ended = this.onLeave(guess.playerId);
            if (ended) return;
            this.cooldownTimer = setTimeout(() => this.onNextRound(), this.cooldownTime * 1000);
        }
        else {
            this.sendSync("Incorrect...");
            // TODO: Spamming guess alias before your actual turn causes double onNextRound() or update(), change this
            this.turn = guess.playerId;
            this.cooldownTimer = setTimeout(() => this.onNextRound(), this.cooldownTime * 1000);
        }
    }
    onLeave(userId) {
        super.onLeave(userId);
        if (this.started) {
            if (this.aliases.has(userId)) {
                this.sendSync(`Their alias was: ${this.aliases.get(userId)}`);
                this.aliases.delete(userId);
            }
            if (this.players.size < 2) {
                this.winner = this.players.firstKey();
                this.onEnd();
                return true;
            }
        }
    }
    update() {
        try {
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
            this.sendSync({ content: `<@${this.turn}>'s turn!`, embeds: [embed] });
        }
        catch (err) {
            if (!(err instanceof GameEndedError)) {
                console.error(err);
            }
        }
    }
}

exports.game = Empires;
exports.id = 'empires';