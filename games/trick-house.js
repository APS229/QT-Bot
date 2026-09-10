'use strict';

const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');

class TrickHouse extends Games.Game {
    constructor(channel, host) {
        super(channel, host);
        this.name = "Trick House";
        this.description = `- Use the \`/choosedoor\` command to pick a door during the round.\n
        - There will be a trap door chosen out of the 3 doors every round.\n
        - If you've picked the trap door or no door, you will get eliminated.\n
        - If only two players are left, there will only be 2 doors to pick from where both players must pick a unique door.\n
        - It is possible everyone gets eliminated by picking the trap door and no one wins.`;
        this.roundTime = 60;
        this.roundTimer = null;
        this.doors = [];
        this.doorsId = [];
        this.trap = '';
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
        const category = Object.keys(this.data).random();
        if (!Array.isArray(this.data[category])) this.data[category] = Object.keys(this.data[category]);
        this.data[category] = this.data[category].shuffle();
        this.doors = this.data[category].slice(0, this.players.size === 2 ? 2 : 3);
        this.doorsId = this.doors.map(Tools.toId);
        this.update();
        for (const player of this.players.keys()) {
            this.players.get(player).choice = '';
        }
        this.canGuess = true;
        this.roundTimer = setTimeout(() => this.setRoundTimer(), this.roundTime * 1000);
    }
    async setRoundTimer() {
        try {
            this.canGuess = false;
            this.trap = this.doors.random();
            const trap = new AttachmentBuilder('./images/trickhouse/trap.png');
            const embed = new EmbedBuilder()
                .setTitle(`The trap door was... __${this.trap}__!`)
                .setImage('attachment://trap.png')
                .setTimestamp()
                .setFooter({
                    text: Config.username,
                    iconURL: Config.avatarURL
                });
            await this.send({ embeds: [embed], files: [trap] });

            for (const [playerId, playerData] of this.players) {
                if (!this.doorsId.includes(playerData.choice)) {
                    await this.send(`<@${playerId}> didn't pick a door and has been eliminated!`);
                    const ended = this.onLeave(playerId);
                    if (ended) return;
                    continue;
                }
                if (playerData.choice === Tools.toId(this.trap)) {
                    await this.send(`<@${playerId}> fell into the trap door and has been eliminated!`);
                    const ended = this.onLeave(playerId);
                    if (ended) return;
                }
            }
            if (this.players.size < 2) {
                if (this.players.size) this.winner = this.players.keys().next().value;
                return this.onEnd();
            }
            this.onNextRound();
        }
        catch (err) {
            if (!(err instanceof GameEndedError)) {
                console.error(err);
            }
        }
    }
    onGuess(userId, door) {
        this.players.get(userId).choice = door;
    }
    update() {
        const players = [...this.players.keys()].map(player => `<@${player}>`);
        const img = new AttachmentBuilder('./images/trickhouse/image.png');
        const embed = new EmbedBuilder()
            .setTitle("Trick House")
            .addFields({ name: "Doors", value: Tools.joinList(this.doors) })
            .setImage('attachment://image.png')
            .setTimestamp()
            .setFooter({
                text: Config.username,
                iconURL: Config.avatarURL
            });
        this.sendSync({ content: Tools.joinList(players), embeds: [embed], files: [img] });
    }
    onLeave(userId) {
        super.onLeave(userId);
    }
}

exports.game = TrickHouse;
exports.id = 'trickhouse';