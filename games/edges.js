'use strict';

const { MessageEmbed } = Client.discord;

class Edges extends Games.PuzzleGame {
    constructor(interaction, points) {
        super(interaction, points || 7);
        this.name = "Edges";
        this.description = `- Use \`guess [answer]\` to make your guess.\n
        - The question will have the starting and ending letters of the answers.`;
        this.freejoin = true;
        this.data = {};
        this.dataKeys = {};
        this.init();
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
        this.roundTimer = setTimeout(() => {
            this.canGuess = false;
            const embed = new MessageEmbed()
                .setTitle("Time's up!")
                .setDescription(`The answers were: *${Tools.joinList(this.currentAnswer)}*`)
            this.channel.send({ embeds: [embed] });
            this.cooldownTimer = setTimeout(() => this.onNextRound(), this.cooldownTime * 1000);
        }, this.roundTime * 1000);
    }
    onGuess(userid, guess) {
        if (this.answer.includes(guess)) {
            clearTimeout(this.roundTimer);
            this.canGuess = false;
            this.players.set(userid, this.players.has(userid) ? this.players.get(userid) + 1 : 1);
            this.channel.send(`<@${userid}> advances to ${this.players.get(userid)} point(s)! The answers were: *${Tools.joinList(this.currentAnswer)}*`);
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
        const embed = new MessageEmbed()
            .setColor("#FFFFFF")
            .setTitle(this.puzzle)
            .setDescription(`**Category:** ${this.category}`)
            .setTimestamp();
        if (players) embed.addField("Players", players);
        this.channel.send({ embeds: [embed] });
    }
    onEnd() {
        if (this.roundTimer) clearTimeout(this.roundTimer);
        if (this.cooldownTimer) clearTimeout(this.cooldownTimer);
        super.onEnd();
    }
}

exports.game = Edges;
exports.id = 'edges';