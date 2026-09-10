'use strict';

const { EmbedBuilder } = require('discord.js');

class DiceDisaster extends Games.Game {
    constructor(channel, host) {
        super(channel, host);
        this.name = "Dice Disaster";
        this.description = `- When the round starts, you will have 45 seconds to bid a number 1 - 100.\n
        - Use the command \`.bid [number]\` to bid a number.\n
        - After the timer a random number will be chosen from 1 to 100.\n
        - If the highest bidder's bid is equal or lower than the random number, then they will win.\n
        - If the highest bidder's bid is higher than random number, then they will be eliminated.\n
        - The player who survives until 1 player is left also wins.\n
        - Nobody will win and the game will end due to inactivity if no one bids anything.`;
        this.roundTime = 45;
        this.roundTimer = null;
        this.cooldownTime = 5;
        this.cooldownTimer = null;
        this.bidder = { id: '', bid: 0 };
    }
    onStart() {
        super.onStart();
        this.onNextRound();
    }
    onNextRound() {
        if (this.ended) return;
        this.bidder.id = '';
        this.bidder.bid = 0;
        this.update();
        this.canGuess = true;
        this.roundTimer = setTimeout(() => this.setRoundTimer(), this.roundTime * 1000);
    }
    setRoundTimer() {
        this.canGuess = false;
        if (this.bidder.id) {
            this.sendSync(`<@${this.bidder.id}> has the highest bid with ${this.bidder.bid}!`);
            this.cooldownTimer = setTimeout(() => this.setCooldownTimer(), this.cooldownTime * 1000);
        }
        else {
            this.sendSync("Nobody bid anything, ending the game.");
            return this.onEnd();
        }
    }
    async setCooldownTimer() {
        try {
            const roll = parseInt((Math.random() * 100) + 1);
            await this.send(`Rolling 1 - 100: ${roll}`);
            if (roll >= this.bidder.bid) {
                this.winner = this.bidder.id;
                return this.onEnd();
            }
            else {
                await this.send(`RIP! <@${this.bidder.id}> has been eliminated.`);
                const ended = this.onLeave(this.bidder.id);
                if (ended) return;
                this.cooldownTimer = setTimeout(() => this.onNextRound(), this.cooldownTime * 1000);
            }
        }
        catch (err) {
            if (!(err instanceof GameEndedError)) {
                console.error(err);
            }
        }
    }
    onGuess(userId, bid) {
        bid = parseInt(bid);
        if (!bid || bid > 100 || bid < 1) return this.mentionReply(userId, "Your bid must be a number from 1 - 100.");
        if (this.bidder.bid >= bid) return;
        this.bidder.id = userId;
        this.bidder.bid = bid;
        this.sendSync(`<@${userId}> bid ${bid}!`);
        if (bid === 100) {
            clearTimeout(this.roundTimer);
            this.sendSync(`<@${this.bidder.id}> has the highest bid with ${this.bidder.bid}!`);
            this.cooldownTimer = setTimeout(() => this.setCooldownTimer(), this.cooldownTime * 1000);
        }
    }
    update() {
        const embed = new EmbedBuilder()
            .setTitle("Dice Disaster")
            .setDescription("Bid a number 1 - 100")
            .setTimestamp()
            .setFooter({
                text: Config.username,
                iconURL: Config.avatarURL
            });
        this.sendSync({ content: Tools.joinList([...this.players.keys()].map(player => `<@${player}>`)), embeds: [embed] });
    }
    onLeave(userId) {
        super.onLeave(userId);
        if (this.started && this.players.size < 2) {
            this.winner = this.players.keys().next()?.value;
            this.onEnd();
            return true;
        }
    }
}

exports.game = DiceDisaster;
exports.id = 'dicedisaster';
