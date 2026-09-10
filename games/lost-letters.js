'use strict';

const VOWELS = ['a', 'e', 'i', 'o', 'u', 'A', 'E', 'I', 'O', 'U'];
const { EmbedBuilder } = require('discord.js');

class LostLetters extends Games.PuzzleGame {
    constructor(channel, host, points) {
        super(channel, host, points || 10);
        this.name = "Lost Letters";
        this.description = `- Use \`.guess [answer]\` to make your guess.\n
        - The vowels in question are missing, you need to fill out the vowels and answer correctly to earn points.`;
        this.freejoin = true;
    }
    onStart() {
        super.onStart();
        this.onNextRound();
    }
    onNextRound() {
        this.category = Object.keys(Client.data).random();
        this.currentAnswer = Array.isArray(Client.data[this.category]) ? Client.data[this.category].random() : Object.keys(Client.data[this.category]).random();
        this.answer = Tools.toId(this.currentAnswer);
        this.puzzle = this.currentAnswer.replaceAll(' ', '');
        for (const vowel of VOWELS) this.puzzle = this.puzzle.replaceAll(vowel, '');
        this.update();
        this.canGuess = true;
        this.roundTimer = setTimeout(() => this.setRoundTimer(), this.roundTime * 1000);
    }
    setRoundTimer() {
        this.canGuess = false;
        const embed = new EmbedBuilder()
            .setTitle("Time's up!")
            .setDescription(`The answer was: *${this.currentAnswer}*`)
        this.sendSync({ embeds: [embed] });
        this.cooldownTimer = setTimeout(() => this.onNextRound(), this.cooldownTime * 1000);
    }
    onGuess(userId, guess) {
        if (guess === this.answer) {
            clearTimeout(this.roundTimer);
            this.canGuess = false;
            this.players.has(userId) ? this.players.get(userId).points++ : this.players.set(userId, { points: 1 });
            this.sendSync(`<@${userId}> advances to ${this.players.get(userId).points} point(s)! The answer was: *${this.currentAnswer}*`);
            if (this.players.get(userId).points === this.points) {
                this.winner = userId;
                return this.onEnd();
            }
            this.cooldownTimer = setTimeout(() => this.onNextRound(), this.cooldownTime * 1000);
        }
    }
    update() {
        const players = [...this.players].map(([player, playerData]) => `<@${player}>: ${playerData.points}`).join('\n');
        const embed = new EmbedBuilder()
            .setColor("#FFFFFF")
            .setTitle(`\`\`${this.puzzle}\`\``)
            .setDescription(`**Category:** ${this.category}`)
            .setTimestamp()
            .setFooter({
                text: Config.username,
                iconURL: Config.avatarURL
            });
        if (players) embed.addFields({ name: "Players", value: players });
        this.sendSync({ embeds: [embed] });
    }
}

exports.game = LostLetters;
exports.id = 'lostletters';