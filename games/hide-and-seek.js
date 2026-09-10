'use strict';

const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');

class HideAndSeek extends Games.Game {
    constructor(channel, host) {
        super(channel, host);
        this.name = "Hide and Seek";
        this.description = `- Every round a random seeker will be picked and every other player must pick a hiding spot.\n
        - After 30 seconds, the seeker can pick a hiding spot to seek in and players hiding there will be eliminated.\n
        - If the seeker finds no one, the seeker will get eliminated.\n
        - The number of hiding spots in the game are equal to the number of current players in game.\n
        - Use the \`/hide\` command to pick a hiding spot as a hider.\n
        - Use the \`.seek [spot]\` command to pick a hiding spot as the seeker.`;
        this.roundTime = 30;
        this.roundTimer = null;
        this.cooldownTime = 5;
        this.cooldownTimer = null;
        this.playerTime = 30;
        this.playerTimer = null;
        this.seeker = null;
        this.canHide = false;
        this.canSeek = false;
        this.choices = [];
        this.choicesId = [];
        this.data = {};
    }
    async loadData() {
        this.data = JSON.parse(fs.readFileSync('./database/categories.json'));
    }
    onStart() {
        super.onStart();
        this.onNextRound();
    }
    onNextRound() {
        if (this.ended) return;
        const category = Object.keys(this.data).random();
        if (!Array.isArray(this.data[category])) this.data[category] = Object.keys(this.data[category]);
        this.data[category] = this.data[category].shuffle();
        this.choices = this.data[category].slice(0, this.players.size);
        this.choicesId = this.choices.map(Tools.toId);
        this.seeker = this.players.randomKey()
        for (const player of this.players.keys()) {
            this.players.get(player).spot = '';
        }
        this.update();
        this.canHide = true;
        this.roundTimer = setTimeout(() => this.setRoundTimer(), this.roundTime * 1000);
    }
    async setRoundTimer() {
        try {
            this.canHide = false;
            for (const [player, playerData] of this.players) {
                if (!playerData.spot && player !== this.seeker) {
                    this.sendSync(`<@${player}> didn't pick a hiding spot to hide in and has been eliminated.`);
                    const ended = this.onLeave(player);
                    if (ended) return;
                }
            }
            await this.send(`Seeker <@${this.seeker}>, pick a hiding spot to seek in! Spots: ${Tools.joinList(this.choices)}`);
            this.canSeek = true;
            this.playerTimer = setTimeout(() => this.setPlayerTimer(), this.playerTime * 1000);
        }
        catch (err) {
            if (!(err instanceof GameEndedError)) {
                console.error(err);
            }
        }
    }
    setPlayerTimer() {
        this.canSeek = false;
        this.sendSync(`<@${this.seeker}> didn't pick a hiding spot to seek in time and has been eliminated!`);
        const ended = this.onLeave(this.seeker);
        if (ended) return;
        this.onNextRound();
    }
    onHide(userId, spot) {
        this.players.get(userId).spot = spot;
    }
    onSeek(spot) {
        this.canSeek = false;
        clearTimeout(this.playerTimer);
        this.sendSync(`<@${this.seeker}> picked ${this.choices[this.choicesId.indexOf(spot)]} and found...`);
        this.cooldownTimer = setTimeout(() => this.setCooldownTimer(spot), this.cooldownTime * 1000);
    }
    async setCooldownTimer(spot) {
        try {
            const elimPlayers = [...this.players.keys()].filter(player => this.players.get(player).spot === spot);
            if (elimPlayers.length) {
                await this.send(`${Tools.joinList(elimPlayers.map(player => `<@${player}>`))} hiding behind it!`);
                for (const player of elimPlayers) {
                    const ended = this.onLeave(player);
                    if (ended) return;
                }
            }
            else {
                await this.send("Nobody!");
                const ended = this.onLeave(this.seeker);
                if (ended) return;
            }
            this.cooldownTimer = setTimeout(() => this.onNextRound(), this.cooldownTime * 1000);
        }
        catch (err) {
            if (!(err instanceof GameEndedError)) {
                console.error(err);
            }
        }
    }
    update() {
        const hiders = [...this.players.keys()];
        hiders.splice(hiders.indexOf(this.seeker), 1);
        const players = Tools.joinList(hiders.map(player => `<@${player}>`));
        const img = new AttachmentBuilder('./images/hideandseek/round.gif');
        const embed = new EmbedBuilder()
            .setTitle('Hide and Seek')
            .setDescription("Please pick a hiding spot from the list below!")
            .addFields({ name: "Hiding spots", value: Tools.joinList(this.choices) })
            .setImage('attachment://round.gif')
            .setTimestamp()
            .setFooter({
                text: Config.username,
                iconURL: Config.avatarURL
            });
        this.sendSync({ content: players, embeds: [embed], files: [img] });
    }
    onLeave(userId) {
        super.onLeave(userId);
        if (this.started) {
            if (this.players.size < 2) {
                this.winner = this.players.firstKey();
                this.onEnd();
                return true;
            }
            if (this.seeker === userId) {
                if (this.playerTimer) clearTimeout(this.playerTimer);
                if (this.roundTimer) clearTimeout(this.roundTimer);
                this.sendSync("The seeker left the game, moving on to next round...");
                this.onNextRound();
            }
        }
    }
}

exports.game = HideAndSeek;
exports.id = 'hideandseek';