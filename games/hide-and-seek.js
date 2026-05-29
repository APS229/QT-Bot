'use strict';

const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');

class HideAndSeek extends Games.Game {
    constructor(interaction) {
        super(interaction);
        this.name = 'Hide and Seek';
        this.description = `- Every round a random seeker will be picked and everyone else will have to go hide in a hiding spot.\n
        - After 30 seconds, the seeker will pick a random hiding spot to seek in and players hiding there will be eliminated.\n
        - If the seeker finds no one, seeker gets eliminated.\n
        - This goes on until there's a single player left.\n
        - Number of hiding spots = number of current players in game.\n
        - Use the /hide command if the bot pings you to hide.\n
        - Use the /seek command if the bot pings you to seek.`;
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
        this.choices = this.data[category].slice(0, this.players.size);
        this.choicesId = this.choices.map(Tools.toId);
        this.seeker = [...this.players.keys()].random();
        for (const player of this.players.keys()) {
            this.players.set(player, 0);
        }
        this.update();
        this.canHide = true;
        this.roundTimer = setTimeout(async () => {
            this.canHide = false;
            for (const [player, playerChoice] of this.players) {
                if (!playerChoice && player !== this.seeker) {
                    this.channel.send(`<@${player}> didn't pick a hiding spot and has been eliminated.`);
                    this.onLeave(player);
                    if (this.players.size < 2) {
                        this.winner = this.players.keys().next().value;
                        return this.onEnd();
                    }
                }
            }
            await this.channel.send(`Seeker <@${this.seeker}>, pick a hiding spot to seek in! Spots: ${Tools.joinList(this.choices)}`);
            if (!this.started) return;
            this.canSeek = true;
            this.playerTimer = setTimeout(() => {
                this.canSeek = false;
                this.channel.send(`<@${this.seeker}> didn't pick a hiding spot to seek in time and has been eliminated!`);
                this.onLeave(this.seeker);
                if (this.players.size < 2) {
                    this.winner = this.players.keys().next().value;
                    return this.onEnd();
                }
                this.onNextRound();
            }, this.playerTime * 1000);
        }, this.roundTime * 1000);
    }
    onHide(interaction) {
        const pickedSpot = interaction.options?._hoistedOptions[0].value;
        if (!pickedSpot) return interaction.reply("Your hiding spot must be anonymous, please use the slash command.");
        const choice = Tools.toId(pickedSpot);
        if (!this.choicesId.includes(choice)) return interaction.reply({ content: `Invalid choice! Current hiding spots are: ${Tools.joinList(this.choices)}`, flags: 'Ephemeral' });
        if (this.players.get(interaction.member.id)) return interaction.reply({ content: "You have already picked a hiding spot!", flags: 'Ephemeral' });
        this.players.set(interaction.member.id, choice);
        interaction.reply({ content: `Your choice is: ${this.choices[this.choicesId.indexOf(choice)]}`, flags: 'Ephemeral' });
    }
    onSeek(interaction) {
        const choice = Tools.toId(interaction.options?._hoistedOptions[0].value || interaction.content.split(' ')[1]);
        if (!this.choicesId.includes(choice)) return interaction.reply({ content: `Invalid choice! Current hiding spots are: ${Tools.joinList(this.choices)}`, flags: 'Ephemeral' });
        this.canSeek = false;
        clearTimeout(this.playerTimer);
        interaction.reply(`<@${interaction.member.id}> picked ${this.choices[this.choicesId.indexOf(choice)]} and found...`);
        const elimPlayers = [...this.players.keys()].filter(player => this.players.get(player) == choice);
        this.cooldownTimer = setTimeout(async () => {
            if (elimPlayers.length) {
                await this.channel.send(`${Tools.joinList(elimPlayers.map(player => `<@${player}>`))} hiding behind it!`);
                if (!this.started) return;
                for (const player of elimPlayers) {
                    this.onLeave(player);
                }
                if (this.players.size < 2) {
                    this.winner = this.players.keys().next().value;
                    return this.onEnd();
                }
            }
            else {
                await this.channel.send("Nobody!");
                if (!this.started) return;
                this.onLeave(this.seeker);
                if (this.players.size < 2) {
                    this.winner = this.players.keys().next().value;
                    return this.onEnd();
                }
            }
            this.cooldownTimer = setTimeout(() => this.onNextRound(), this.cooldownTime * 1000);
        }, this.cooldownTime * 1000);
    }
    update() {
        const hiders  = [...this.players.keys()];
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
        this.channel.send({ content: players, embeds: [embed], files: [img] });
    }
    onLeave(userid) {
        super.onLeave(userid);
        if (this.seeker === userid && this.canSeek) {
            if (this.playerTimer) clearTimeout(this.playerTimer);
            if (this.roundTimer) clearTimeout(this.roundTimer);
            this.channel.send("The seeker left the game, moving on to next round...");
            if (this.players.size < 2) {
                this.winner = this.players.keys().next().value;
                return this.onEnd();
            }
            this.onNextRound();
        }
        if (this.seeker !== userid && this.players.size < 2) {
            this.winner = this.players.keys().next().value;
            return this.onEnd();
        }
    }
}

exports.game = HideAndSeek;
exports.id = 'hideandseek';