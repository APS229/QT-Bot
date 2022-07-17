'use strict';

const { MessageEmbed } = Client.discord;

class Trivia extends Games.PuzzleGame {
    constructor(interaction, points) {
        super(interaction, points || 10);
        this.name = 'Trivia';
        this.description = `- Use guess [answer] to make your guess. Example: \`guess answer\`\n
        - The bot will say the description of an item and you have to guess the item.\n
        - All words are Dank items.`;
        this.freejoin = true;
        this.data = {};
        this.dataKeys = [];
        this.init();
    }
    async loadData() {
        for (const word in Client.data.items) {
            const desc = Client.data.items[word].description;
            if (!(desc in this.data)) {
                this.data[desc] = [];
                this.dataKeys.push(desc);
            }
            this.data[desc].push(word);
        }
    }
    onStart() {
        super.onStart();
        this.onNextRound();
    }
    onNextRound() {
        this.puzzle = this.dataKeys.random();
        this.currentAnswer = this.data[this.puzzle];
        this.answer = this.currentAnswer.map(a => Tools.toId(a));
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
            this.players.set(userid, this.players.has(userid) ? this.players.get(userid) + 1: 1);
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
            .setTitle("Trivia")
            .setDescription(this.puzzle)
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

exports.game = Trivia;
exports.id = 'trivia';