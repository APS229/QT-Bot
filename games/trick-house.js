'use strict';

const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');

class TrickHouse extends Games.Game {
    constructor(interaction) {
        super(interaction);
        this.name = "Trick House";
        this.description = `- Use the \`/choosedoor\` command to pick a door during the round.\n
        - There will be a trap door chosen out of the 3 doors every time.\n
        - If you've picked the trap door or no door, you will get eliminated.\n
        - If only two players are left, there will only be 2 doors to pick from where both players must pick a unique door.\n
        - It is possible everyone gets eliminated by picking the trap door and no one wins.`;
        this.roundTime = 45;
        this.roundTimer = null;
        this.doors = [];
        this.doorsId = [];
        this.trap = '';
        this.data = {};
        this.init();
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
            this.players.set(player, 0);
        }
        this.canGuess = true;
        this.roundTimer = setTimeout(async () => {
            this.canGuess = false;
            this.trap = this.doors.random();
            const trap = new AttachmentBuilder('./images/trickhouse/trap.jpg');
            const embed = new EmbedBuilder()
                .setTitle(`The trap door was... __${this.trap}__!`)
                .setImage('attachment://trap.jpg')
                .setTimestamp()
                .setFooter({
                    text: Config.username,
                    iconURL: Config.avatarURL
                });
            await this.channel.send({ embeds: [embed], files: [trap] });
            if (!this.started) return;

            for (const [playerId, playerChoice] of this.players.entries()) {
                if (!this.doorsId.includes(playerChoice)) {
                    this.onLeave(playerId);
                    this.channel.send(`<@${playerId}> didn't pick a door and has been eliminated!`);
                    continue;
                }
                if (playerChoice === Tools.toId(this.trap)) {
                    this.onLeave(playerId);
                    this.channel.send(`<@${playerId}> fell into the trap door and has been eliminated!`);
                }
            }
            if (this.players.size < 2) {
                if (this.players.size) this.winner = this.players.keys().next().value;
                return this.onEnd();
            }
            this.onNextRound();
        }, this.roundTime * 1000);
    }
    onGuess(interaction) {
        const choice = Tools.toId(interaction.options?._hoistedOptions[0].value || interaction.content.split(' ')[1]);
        if (!this.doorsId.includes(choice)) return interaction.reply({ content: `Invalid choice! Current doors are: ${Tools.joinList(this.doors)}`, flags: 'Ephemeral' });
        if (this.players.get(interaction.member.id)) return interaction.reply({ content: "You have already picked a door!", flags: 'Ephemeral' });
        if (this.players.size === 2 && [...this.players.values()].filter(d => d !== 0)[0] === choice) return interaction.reply({ content: "Someone else has already picked that door! Please choose another.", flags: 'Ephemeral' });
        this.players.set(interaction.member.id, choice);
        interaction.reply({ content: `You have chosen the door: ${this.doors[this.doorsId.indexOf(choice)]}`, flags: 'Ephemeral' });
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
        this.channel.send({ content: Tools.joinList(players), embeds: [embed], files: [img] });
    }
}

exports.game = TrickHouse;
exports.id = 'trickhouse';