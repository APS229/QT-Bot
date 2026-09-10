'use strict';

const { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, Collection, EmbedBuilder } = require('discord.js');
const fs = require('fs');

class Game {
    constructor(channel, host, points) {
        this.name = "Game";
        this.description = "No description.";
        this.started = false;
        this.ended = false;
        this.points = points;
        this.players = new Collection();
        this.freejoin = false;
        this.winner = null;
        this.requiredPlayers = 2;
        this.maxPlayers = 20;
        this.host = host;
        this.channel = channel;
    }
    async init() {
        try {
            if (Tools.isEmptyObject(Client.data)) {
                const message = await this.send("Loading game data since last restart...");
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
                            .setCustomId('join')
                            .setLabel('Join')
                            .setStyle('Success'),
                        new ButtonBuilder()
                            .setCustomId('leave')
                            .setLabel('Leave')
                            .setStyle('Danger')
                    )
                );
            }
            if (this.points) {
                startMessage.embeds[0].addFields({ name: "__Points required to win__", value: `${this.points}` });
            }
            this.startMessage = await this.send(startMessage);
            if (!this.freejoin) this.updatePlayerListMessage();
            else this.cooldownTimer = setTimeout(() => this.onStart(), 5000);
        }
        catch (err) {
            if (!(err instanceof GameEndedError)) {
                console.error(err);
            }
        }
    }
    async loadWords() {
        Client.data = JSON.parse(fs.readFileSync('./database/categories.json'));
    }
    onStart() {
        this.started = true;
        if (!this.freejoin) {
            this.disableStartMessageButtons();
        }
    }
    onJoin(userData) {
        if (this.players.size === this.maxPlayers) return this.sendSync("The game has reached the max amount of players!");
        this.players.set(userData.id, { tag: userData.tag, points: 0 });
        if (!this.started && this.startMessage) this.updatePlayerListMessage();
    }
    onLeave(userId) {
        this.players.delete(userId);
        if (!this.started) this.updatePlayerListMessage();
    }
    onEnd() {
        if (this.cooldownTimer) clearTimeout(this.cooldownTimer);
        if (this.roundTimer) clearTimeout(this.roundTimer);
        if (this.playerTimer) clearTimeout(this.playerTimer);
        if (!this.freejoin) this.disableStartMessageButtons();
        if (this.winner) this.sendSync(`The winner is <@${this.winner}>!`);
        else this.sendSync("No winners this game.");
        this.started = false;
        this.ended = true;
        delete Client.activeGame;
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
        if (!this.playerListMessage) return this.playerListMessage = await this.send({ embeds: [embed] });
        this.playerListMessage.edit({ embeds: [embed] });
    }
    disableStartMessageButtons() {
        if (this.startMessage) {
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

    mentionReply(userId, message) {
        this.sendSync(`<@${userId}>\n${message}`);
    }
    sendSync(message) {
        const result = this.channel.send(message);
        return result;
    }
    async send(message) {
        if (this.ended) throw new GameEndedError("[SEND] Game already ended");

        const result = await this.channel.send(message);
        if (this.ended) throw new GameEndedError("[SEND] Game already ended");
        return result;
    }
    async queue(promise) {
        if (this.ended) throw new GameEndedError("[QUEUE] Game already ended");

        const result = await promise;

        if (this.ended) throw new GameEndedError("[QUEUE] Game already ended");
        return result;
    }

    static async create(channel, host, points) {
        const game = new this(channel, host, points);
        await game.init();
        return game;
    }
}

class PuzzleGame extends Game {
    constructor(channel, host, points) {
        super(channel, host, points);
        this.puzzle = '';
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