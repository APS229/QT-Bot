'use strict';

const { AttachmentBuilder, EmbedBuilder } = require('discord.js');

class Hangman extends Games.PuzzleGame {
    constructor(interaction, points) {
        super(interaction, points || 3);
        this.name = "Hangman";
        this.description = `- Use \`/guess [letter/word]\` to make your guess. Examples: \`/guess answer\`, \`/guess a\`\n
        - If the guessed letter is in the word, the underscores containing the letter will be replaced by the letter.\n
        - You can guess the word even if it's not your turn.\n
        - You cannot guess the letter if it's not your turn.\n
        - You will get a point for guessing the last letter or the right word.`;
        this.usedGuesses = [];
        this.lives = 5;
        this.queue = [];
        this.init();
    }
    onStart() {
        super.onStart();
        for (const player of this.players.keys()) this.queue.push(player);
        this.onNextRound();
    }
    onNextRound() {
        if (!this.started) return;
        if (this.playerTimer) clearTimeout(this.playerTimer);
        this.category = Object.keys(Client.data).random();
        this.currentAnswer = Array.isArray(Client.data[this.category]) ? Client.data[this.category].random() : Object.keys(Client.data[this.category]).random();
        this.answer = Tools.toId(this.currentAnswer);
        this.puzzle = [];
        this.usedGuesses = [];
        this.lives = 6;
        for (let i = 0; i < this.currentAnswer.length; i++) {
            if (this.currentAnswer[i] === ' ') this.puzzle.push('/');
            else if (this.currentAnswer[i] === "'" || this.currentAnswer[i] === "-") this.puzzle.push(this.currentAnswer[i]);
            else this.puzzle.push('_');
        }
        this.queue = this.queue.shuffle();
        this.canGuess = true;
        this.update();
        this.playerTimer = setTimeout(() => {
            if (!this.started) return;
            this.channel.send(`Skipping <@${this.queue[0]}>'s turn...`);
            const previousPlayer = this.queue[0];
            this.queue.shift();
            this.queue.push(previousPlayer);
            this.update();
            this.playerTimer = setTimeout(() => this.skipPlayer(), this.playerTime * 1000);
        }, this.playerTime * 1000);
    }
    onGuess(userId, guess) {
        if (!this.canGuess || !this.players.has(userId) || this.usedGuesses.includes(guess)) return;
        if (!guess.length) return this.channel.send(`<@${userId}>, your guess must have alphanumeric characters.`);
        if (guess.length === 1) {
            if (this.usedGuesses.includes(guess) || Tools.toId(this.puzzle.join('')).includes(guess) || this.queue[0] !== userId) return;
            let successfulGuess = false;
            for (let i = 0; i < this.currentAnswer.length; i++) {
                if (this.currentAnswer[i].toLowerCase() === guess) {
                    this.puzzle[i] = this.currentAnswer[i];
                    successfulGuess = true;
                }
            }
            if (Tools.toId(this.puzzle.join('')) === this.answer) {
                this.players.set(userId, this.players.has(userId) ? this.players.get(userId) + 1 : 1);
                this.channel.send(`<@${userId}> advances to ${this.players.get(userId)} point(s)! The answer was: *${this.currentAnswer}*`);
                if (this.players.get(userId) === this.points) {
                    this.winner = userId;
                    return this.onEnd();
                }
                this.canGuess = false;
                this.cooldownTimer = setTimeout(() => {
                    this.onNextRound();
                }, this.cooldownTime * 1000);
                return;
            }
            if (!successfulGuess) this.usedGuesses.push(guess);
            if (this.usedGuesses.length === this.lives) {
                this.canGuess = false;
                const img = new AttachmentBuilder('./images/hangman/6.png');
                const embed = new EmbedBuilder()
                    .setTitle("☠️ The man was hanged because of too many bad guesses! ☠️")
                    .setDescription(`The answer was: *${this.currentAnswer}*`)
                    .setImage('attachment://6.png')
                    .setTimestamp()
                    .setFooter({
                        text: Config.username,
                        iconURL: Config.avatarURL
                    });
                this.channel.send({ embeds: [embed], files: [img] });
                if (this.playerTimer) clearTimeout(this.playerTimer);
                this.cooldownTimer = setTimeout(() => {
                    this.onNextRound();
                }, this.cooldownTime * 1000);
                return;
            }
            const previousPlayer = this.queue[0];
            this.queue.shift();
            this.queue.push(previousPlayer);
            if (this.playerTimer) clearTimeout(this.playerTimer);
            this.update();
            this.playerTimer = setTimeout(() => this.skipPlayer(), this.playerTime * 1000);
        }
        else if (guess.length > 1) {
            if (guess === this.answer) {
                this.players.set(userId, this.players.has(userId) ? this.players.get(userId) + 1 : 1);
                this.channel.send(`<@${userId}> advances to ${this.players.get(userId)} point(s)! The answer was: *${this.currentAnswer}*`);
                if (this.players.get(userId) === this.points) {
                    this.winner = userId;
                    return this.onEnd();
                }
                this.canGuess = false;
                if (this.playerTimer) clearTimeout(this.playerTimer);
                this.cooldownTimer = setTimeout(() => {
                    this.onNextRound();
                }, this.cooldownTime * 1000);
                return;
            }
            else {
                if (guess.length === this.answer.length) this.usedGuesses.push(guess);
                if (this.usedGuesses.length === this.lives) {
                    this.canGuess = false;
                    const img = new AttachmentBuilder('./images/hangman/6.png');
                    const embed = new EmbedBuilder()
                        .setTitle("☠️ The man was hanged because of too many bad guesses! ☠️")
                        .setDescription(`The answer was: *${this.currentAnswer}*`)
                        .setImage('attachment://6.png')
                        .setTimestamp()
                        .setFooter({
                            text: Config.username,
                            iconURL: Config.avatarURL
                        });
                    this.channel.send({ embeds: [embed], files: [img] });
                    if (this.playerTimer) clearTimeout(this.playerTimer);
                    if (this.players.size > 1) this.cooldownTimer = setTimeout(() => {
                        this.onNextRound();
                    }, this.cooldownTime * 1000);
                    return;
                }
                this.channel.send(`<@${userId}> incorrect, that is not the answer.`);
            }
        }
    }
    update() {
        const players = '***** ' + this.queue.map(player => `<@${player}>: ${this.players.get(player)}`).join('\n');
        const img = new AttachmentBuilder(`./images/hangman/${this.usedGuesses.length}.png`);
        const embed = new EmbedBuilder()
            .setColor("#FFFFFF")
            .setTitle(`\`\`${this.puzzle.join(' ')}\`\``)
            .setDescription(`**Category:** ${this.category}`)
            .addFields({ name: "Current player", value: `<@${this.queue[0]}>`, inline: true })
            .addFields({ name: "Used guesses", value: this.usedGuesses.length ? this.usedGuesses.join(', ') : "None", inline: true })
            .addFields({ name: "All players", value: players, inline: true })
            .setImage(`attachment://${this.usedGuesses.length}.png`)
            .setTimestamp()
            .setFooter({
                text: Config.username,
                iconURL: Config.avatarURL
            });
        this.channel.send({ content: `<@${this.queue[0]}>'s turn!`, embeds: [embed], files: [img] });
    }
    skipPlayer() {
        if (!this.started) return;
        this.channel.send(`Skipping <@${this.queue[0]}>'s turn...`);
        const previousPlayer = this.queue[0];
        this.queue.shift();
        this.queue.push(previousPlayer);
        this.update();
        this.playerTimer = setTimeout(() => this.skipPlayer(), this.playerTime * 1000);
    }
}

exports.game = Hangman;
exports.id = 'hangman';