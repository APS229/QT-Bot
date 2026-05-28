'use strict';

const { EmbedBuilder } = require('discord.js');

class RussianRoulette extends Games.Game {
    constructor(interaction, points) {
        super(interaction, points || 10);
        this.name = 'Russian Roulette';
        this.description = `- Use \`guess [1-6]\` to make a guess for the roll on your turn.\n
        - If the rolled number is less than or equal to your guess, you will be eliminated.\n
        - If the rolled number is more than your guess, you will get points equal to your guess.\n
        - You will win if you reach the the required points to win or if you are the only player left.`;
        this.type = 'elim';
        this.queue = [];
        this.playerTime = 15;
        this.cooldownTime = 5;
        this.playerTimer = null;
        this.cooldownTimer = null;
        this.init();
    }
    onStart() {
        super.onStart();
        for (const player of this.players.keys()) {
            this.queue.push(player);
        }
        this.queue = this.queue.shuffle();
        this.onNextRound();
    }
    onNextRound() {
        this.canGuess = true;
        this.update();
        this.playerTimer = setTimeout(() => {
            this.channel.send(`Time's up! <@${this.queue[0]}> didn't make a guess and has been eliminated.`);
            this.onLeave(this.queue[0]);
            this.queue.shift();
            if (this.queue.length < 2) {
                this.winner = this.queue[0];
                return this.onEnd();
            }
            this.cooldownTimer = setTimeout(() => this.onNextRound(), this.cooldownTime * 1000);
        }, this.playerTime * 1000);
    }
    onGuess(userid, guess) {
        if (userid !== this.queue[0]) return;
        guess = parseInt(guess);
        if (isNaN(guess) || guess > 6 || guess < 1) return this.channel.send("Your guess must be a number between 1 - 6.");
        clearTimeout(this.playerTimer);
        this.canGuess = false;
        const roll = parseInt((Math.random() * 7) + 1);
        const embed = new EmbedBuilder()
            .setTitle("Rolling 1 - 7")
            .setDescription(`\`${roll}\``)
            .setTimestamp();
        this.channel.send({ embeds: [embed] });
        if (roll <= guess) {
            this.onLeave(userid);
            this.channel.send(`RIP! <@${userid}> has been eliminated!`);
            this.queue.shift();
            if (this.queue.length < 2) {
                this.winner = this.queue[0];
                return this.onEnd();
            }
        }
        else {
            this.channel.send(`Lucky! <@${userid}> earned ${guess} points.`);
            this.players.set(userid, this.players.get(userid) + guess);
            if (guess >= this.points) {
                this.winner = userid;
                return this.oEnd();
            }
            this.queue.shift();
            this.queue.push(userid);
        }
        setTimeout(() => this.onNextRound(), this.cooldownTime * 1000);
    }
    update() {
        let players = "";
        for (const player of this.queue) {
            players += `<@${player}>: ${this.players.get(player)}\n`;
        }
        const embed = new EmbedBuilder()
            .setColor("#FFFFFF")
            .setTitle("Russian Roulette")
            .setTimestamp()
            .addFields({ name: "Players", value: players });
        this.channel.send({ content: `<@${this.queue[0]}>'s turn!`, embeds: [embed] });
    }
    onEnd() {
        if (this.cooldownTimer) clearTimeout(this.cooldownTimer);
        if (this.playerTimer) clearTimeout(this.playerTimer);
        super.onEnd();
    }
}

// exports.game = RussianRoulette;
// exports.id = 'russianroulette';