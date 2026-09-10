'use strict';

const { EmbedBuilder } = require('discord.js');

class Edges extends Games.PuzzleGame {
    constructor(channel, host, points) {
        super(channel, host, points || 7);
        this.name = "Edges";
        this.description = `- Use \`.guess [answer]\` to make your guess.\n
        - The question will have the starting and ending letters of the answer.`;
        this.freejoin = true;
        this.data = {};
        this.dataKeys = {};
    }
    async loadData() {
        for (const category of Object.keys(Client.data)) {
            this.data[category] = {};
            this.dataKeys[category] = [];
            const categoryData = Array.isArray(Client.data[category]) ? Client.data[category] : Object.keys(Client.data[category]);
            for (const item of categoryData) {
                if (item.length < 3 || !Tools.LETTERS.includes(item[0].toLowerCase()) || !Tools.LETTERS.includes(item.substr(-1).toLowerCase())) continue;
                const edge = item[0] + ' - ' + item.substr(-1);
                if (!(edge in this.data[category])) {
                    this.data[category][edge] = [];
                    this.dataKeys[category].push(edge);
                }
                this.data[category][edge].push(item);
            }
        }
    }
    onStart() {
        super.onStart();
        this.onNextRound();
    }
    onNextRound() {
        this.category = Object.keys(this.dataKeys).random();
        this.puzzle = this.dataKeys[this.category].random();
        this.currentAnswer = this.data[this.category][this.puzzle];
        this.answer = this.currentAnswer.map(Tools.toId);
        this.update();
        this.canGuess = true;
        this.roundTimer = setTimeout(() => this.setRoundTimer(), this.roundTime * 1000);
    }
    setRoundTimer() {
        this.canGuess = false;
        const embed = new EmbedBuilder()
            .setTitle("Time's up!")
            .setDescription(`The answers were: *${Tools.joinList(this.currentAnswer)}*`)
        this.sendSync({ embeds: [embed] });
        this.cooldownTimer = setTimeout(() => this.onNextRound(), this.cooldownTime * 1000);
    }
    onGuess(userId, guess) {
        if (this.answer.includes(guess)) {
            clearTimeout(this.roundTimer);
            this.canGuess = false;
            this.players.has(userId) ? this.players.get(userId).points++ : this.players.set(userId, { points: 1 });
            this.sendSync(`<@${userId}> advances to ${this.players.get(userId).points} point(s)! The answers were: *${Tools.joinList(this.currentAnswer)}*`);
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
            .setTitle(this.puzzle)
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

exports.game = Edges;
exports.id = 'edges';