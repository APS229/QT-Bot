'use strict';

const { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, EmbedBuilder } = require('discord.js');
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
        this.requiredPlayers = 1;
        this.maxPlayers = 20;
        const hostUser = interaction.user || interaction.author;
        this.host = { tag: hostUser.tag, id: hostUser.id, icon: hostUser.avatarURL() };
        this.channel = interaction.channel;
    }
    async init() {
        if (!Object.keys(Client.data)?.length) {
            const message = await this.channel.send("Loading game data since last restart...");
            await this.loadWords();
            message.edit("Game data successfully loaded!");
        }
        if (this.loadData) await this.loadData();
        const img = new AttachmentBuilder(`./images/${this.id}/image.png`);
        const thumbnail = new AttachmentBuilder(`./images/${this.id}/thumbnail.png`);
        const startMessage = { embeds: [], files: [img, thumbnail], components: [] };
        startMessage.embeds.push(new EmbedBuilder()
            .setColor('#FFFFFF')
            .setTitle(this.name)
            .setDescription("**__Tips__**\n\n" + this.description)
            .setImage('attachment://image.png')
            .setThumbnail('attachment://thumbnail.png')
            .setTimestamp()
            .setFooter({ text: `Started by ${this.host.tag}`, iconURL: this.host.icon })
        );
        if (!this.freejoin) {
            startMessage.components.push(new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('joingame')
                        .setLabel('Join')
                        .setStyle('Success'),
                    new ButtonBuilder()
                        .setCustomId('leavegame')
                        .setLabel('Leave')
                        .setStyle('Danger')
                )
            );
        }
        if (this.points) {
            startMessage.embeds[0].addFields({ name: "__Points required to win__", value: `${this.points}` });
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
            const components = this.startMessage.components[0].components;
            const newComponents = [];
            const row = new ActionRowBuilder();
            for (const button of components) {
                row.addComponents(ButtonBuilder.from(button).setDisabled(true));
            }
            newComponents.push(row);
            this.startMessage.edit({ components: newComponents });
            this.startMessage = null;
        }
    }
    async updatePlayerListMessage() {
        const players = [...this.players.keys()].map(player => player = `<@${player}>`).join('\n');
        const embed = new EmbedBuilder()
            .setTitle(`Players (${this.players.size})`)
            .setDescription(players || "None")
            .setTimestamp()
            .setFooter({
                text: Config.username,
                iconURL: Config.avatarURL
            });
        if (!this.playerListMessage) return this.playerListMessage = await this.channel.send({ embeds: [embed] });
        this.playerListMessage.edit({ embeds: [embed] });
    }
    onJoin(userId, userTag) {
        if (this.players.size === this.maxPlayers) return this.channel.send("The game has reached the max amount of players!");
        this.players.set(userId, userTag);
        if (!this.started) this.updatePlayerListMessage();
    }
    onLeave(userId) {
        this.players.delete(userId);
        if (!this.started) this.updatePlayerListMessage();
        if (this.started && this.skipPlayer) {
            const index = this.queue.indexOf(userId);
            this.queue.splice(index, 1);
            if (this.queue.length < 2) {
                this.channel.send(`Not enough players, ending the game of ${this.name}...`);
                this.winner = this.queue[0];
                return this.onEnd();
            }
            if (index === 0) {
                if (this.playerTimer) clearTimeout(this.playerTimer);
                this.update();
                this.playerTimer = setTimeout(() => this.skipPlayer(), this.playerTime * 1000);
            }
        }
    }
    onEnd() {
        this.started = false;
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