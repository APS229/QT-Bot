'use strict';

const { MessageActionRow, MessageAttachment, MessageButton, MessageEmbed } = Client.discord;
const fs = require('fs');

class Game {
    constructor(interaction, points) {
        this.name = "Game";
        this.description = "No description."
        this.started = false;
        this.points = points;
        this.players = new Map();
        this.freejoin = false;
        this.winner = null;
        this.requiredPlayers = 2;
        this.maxPlayers = 20;
        this.host = { id: interaction.user.id, icon: interaction.user.avatarURL() };
        this.channel = interaction.member.guild.channels.cache.get(interaction.channelId);
    }
    async init() {
        if (!Object.keys(Client.data)?.length) {
            const message = await this.channel.send("Loading game data since last restart...");
            await this.loadWords();
            message.edit("Game data successfully loaded!");
        }
        if (this.loadData) await this.loadData();
        const img = new MessageAttachment(`./images/${this.id}/image.png`);
        const thumbnail = new MessageAttachment(`./images/${this.id}/thumbnail.png`);
        const startMessage = { embeds: [], files: [img, thumbnail], components: [] };
        startMessage.embeds.push(new MessageEmbed()
            .setColor('#FFFFFF')
            .setTitle(this.name)
            .setDescription("**__Tips__**\n\n" + this.description)
            .setImage('attachment://image.png')
            .setThumbnail('attachment://thumbnail.png')
            .setTimestamp()
            .setFooter({ text: `Started by ${this.host.id}`, iconURL: this.host.icon })
        );
        if (!this.freejoin) {
            startMessage.components.push(new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('joingame')
                        .setLabel('Join')
                        .setStyle('SUCCESS'),
                    new MessageButton()
                        .setCustomId('leavegame')
                        .setLabel('Leave')
                        .setStyle('DANGER')
                )
            );
        }
        if (this.points) {
            startMessage.embeds[0].addField("__Points required to win__", `${this.points}`);
        }
        this.startMessage = await this.channel.send(startMessage);
        if (this.freejoin) this.cooldownTimer = setTimeout(() => this.onStart(), 5000);
    }
    async loadWords() {
        Client.data = JSON.parse(fs.readFileSync('./database/categories.json'));
    }
    onStart() {
        this.started = true;
        if (!this.freejoin) {
            const components = this.startMessage.components;
            for (const component of components[0].components) {
                component.disabled = true;
            }
            this.startMessage.edit({ components: components });
            this.startMessage = null;
        }
    }
    onJoin(userid) {
        this.players.set(userid, 0);
        if (this.players.size === this.maxPlayers) this.channel.send("The game has reached max amount of players!");
    }
    async onLeave(userid) {
        this.players.delete(userid);
        if (this.started && this.skipPlayer) {
            const index = this.queue.indexOf(userid);
            this.queue.splice(index, 1);
            if (index === 0) {
                if (this.playerTimer) clearTimeout(this.playerTimer);
                this.update();
                this.playerTimer = setTimeout(() => this.skipPlayer(), this.playerTime * 1000);
            }
            if (this.queue.length < 2) {
                this.channel.send(`Not enough players, ending the game of ${this.name}...`);
                this.winner = this.queue[0];
                this.onEnd();
            }
        }
    }
    onEnd() {
        if (this.cooldownTimer) clearTimeout(this.cooldownTimer);
        if (this.roundTimer) clearTimeout(this.roundTimer);
        if (this.playerTimer) clearTimeout(this.playerTimer);
        if (this.winner) this.channel.send(`The winner is <@${this.winner}>!`);
        else this.channel.send("No winners this game.");
        delete Client.activeGame;
    }
}

class PuzzleGame extends Game {
    constructor(interaction, points) {
        super(interaction, points);
        this.puzzle = '';
        this.queue = [];
        this.currentAnswer = '';
        this.type = 'puzzle';
        this.playerTime = 15;
        this.cooldownTime = 5;
        this.roundTime = 15;
        this.playerTimer = null;
        this.cooldownTimer = null;
        this.roundTimer = null;
        this.canGuess = false;
    }
}

exports.PuzzleGame = PuzzleGame;
exports.Game = Game;