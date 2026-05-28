'use strict';

const VOWELS = ['a', 'e', 'i', 'o', 'u', 'A', 'E', 'I', 'O', 'U'];
const { EmbedBuilder } = require('discord.js');

class LostLetters extends Games.PuzzleGame {
    constructor(interaction, points) {
        super(interaction, points || 10);
        this.name = 'Lost Letters';
        this.description = `- Use guess [answer] to make your guess. Example: \`guess answer\`\n
        - The vowels in question are missing, you need to fill out the vowels and answer correctly to earn points.`;
        this.freejoin = true;
        this.init();
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
        this.roundTimer = setTimeout(() => {
            this.canGuess = false;
            const embed = new EmbedBuilder()
                .setTitle("Time's up!")
                .setDescription(`The answer was: *${this.currentAnswer}*`)
            this.channel.send({ embeds: [embed] });
            this.cooldownTimer = setTimeout(() => this.onNextRound(), this.cooldownTime * 1000);
        }, this.roundTime * 1000);
    }
    onGuess(userid, guess) {
        if (guess === this.answer) {
            clearTimeout(this.roundTimer);
            this.canGuess = false;
            this.players.set(userid, this.players.has(userid) ? this.players.get(userid) + 1 : 1);
            this.channel.send(`<@${userid}> advances to ${this.players.get(userid)} point(s)! The answer was: *${this.currentAnswer}*`);
            if (this.players.get(userid) === this.points) {
                this.winner = userid;
                return this.onEnd();
            }
            this.cooldownTimer = setTimeout(() => this.onNextRound(), this.cooldownTime * 1000);
        }
    }
    update() {
        let players = "";
        for (const player of this.players.entries()) {
            players += `<@${player[0]}>: ${player[1]}\n`;
        }
        const embed = new EmbedBuilder()
            .setColor("#FFFFFF")
            .setTitle(`\`\`${this.puzzle}\`\``)
            .setDescription(`**Category:** ${this.category}`)
            .setTimestamp();
        if (players) embed.addFields({ name: "Players", value: players });
        this.channel.send({ embeds: [embed] });
    }
}

exports.game = LostLetters;
exports.id = 'lostletters';