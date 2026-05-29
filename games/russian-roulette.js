'use strict';

const { EmbedBuilder } = require('discord.js');

class RussianRoulette extends Games.Game {
    constructor(interaction, points) {
        super(interaction, points || 10);
        this.name = 'Russian Roulette';
        this.description = `- Use \`/guess [1-6]\` to make a guess for the roll on your turn.\n
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
        if (!this.started) return;
        this.canGuess = true;
        this.update();
        this.playerTimer = setTimeout(() => {
            this.channel.send(`Time's up! <@${this.queue[0]}> didn't make a guess and has been eliminated.`);
            this.onLeave(this.queue[0]);
            if (!this.started) return;
            this.queue.shift();
            this.canGuess = false;
            this.cooldownTimer = setTimeout(() => this.onNextRound(), this.cooldownTime * 1000);
        }, this.playerTime * 1000);
    }
    onGuess(userId, guess) {
        if (userId !== this.queue[0]) return;
        guess = parseInt(guess);
        if (!guess || guess > 6 || guess < 1) return this.channel.send("Your guess must be a number from 1 - 6.");
        clearTimeout(this.playerTimer);
        this.canGuess = false;
        const roll = parseInt((Math.random() * 7) + 1);
        const embed = new EmbedBuilder()
            .setTitle("Rolling 1 - 7")
            .setDescription(`\`${roll}\``)
            .setTimestamp()
            .setFooter({
                text: Config.username,
                iconURL: Config.avatarURL
            });
        this.channel.send({ embeds: [embed] });
        if (roll <= guess) {
            this.channel.send(`RIP! <@${userId}> has been eliminated!`);
            this.onLeave(userId);
            this.queue.shift();
        }
        else {
            this.channel.send(`Lucky! <@${userId}> earned ${guess} points.`);
            this.players.set(userId, this.players.get(userId) + guess);
            if (this.players.get(userId) >= this.points) {
                this.winner = userId;
                return this.onEnd();
            }
            this.queue.shift();
            this.queue.push(userId);
        }
        this.cooldownTimer = setTimeout(() => this.onNextRound(), this.cooldownTime * 1000);
    }
    update() {
        const players = this.queue.map(player => `<@${player}>: ${this.players.get(player)}`).join('\n');
        const embed = new EmbedBuilder()
            .setColor("#FFFFFF")
            .setTitle("Russian Roulette")
            .setTimestamp()
            .setFooter({
                text: Config.username,
                iconURL: Config.avatarURL
            })
            .addFields({ name: "Players", value: players });
        this.channel.send({ content: `<@${this.queue[0]}>'s turn!`, embeds: [embed] });
    }
    onLeave(userId) {
        super.onLeave(userId);
        if (this.players.size < 2) {
            this.winner = this.players.keys().next()?.value;
            return this.onEnd();
        }
    }
}

exports.game = RussianRoulette;
exports.id = 'russianroulette';