'use strict';

const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');

class GobbleWoman extends Games.Game {
    constructor(interaction) {
        super(interaction);
        this.name = "Gobble Woman";
        this.description = `Gobble Woman has gotten really mad because people didn't remember her birthday, they shall face the consequnces!\n
        It is <@463199861152415744>'s birthday today and ya'll better wish her!`;
        this.messages = "";
        this.cooldownTime = 10;
        this.cooldownTimer = null;
        this.data = {};
        this.init();
    }
    async loadData() {
        // 1 = death, 2 = mad, 3 = survived, 4 = liked, 5 = loved
        this.data = JSON.parse(fs.readFileSync('./database/gobblewoman.json'));
    }
    onStart() {
        super.onStart();
        this.cooldownTimer = setTimeout(() => this.onNextRound(), 5000);
    }
    async onNextRound() {
        this.messages = "";
        for (const player of this.players.keys()) {
            const roll = parseInt((Math.random() * 3) + 1).toString();
            if (roll !== '3') this.messages += '- ' + this.data[roll].random().replaceAll('{user}', `<@${player}>`) + '\n\n';
            if (roll === '1') {
                this.onLeave(player);
                if (this.players.size === 1) {
                    this.winner = this.players.keys().next().value;
                    this.messages += `- <@${this.winner}> brought a mandarin cake for Gobble Woman's birthday and she calmed down!`;
                    await this.update();
                    return this.onEnd();
                }
            }
        }
        this.update();
        this.cooldownTimer = setTimeout(() => this.onNextRound(), this.cooldownTime * 1000);
    }
    async update() {
        const img = new AttachmentBuilder('./images/gobblewoman/gobble.gif');
        const embed = new EmbedBuilder()
        .setTitle("Gobble Woman")
        .setDescription(this.messages || "Nothing happened.")
        .setImage('attachment://gobble.gif')
        .setAuthor({name: 'Happy Birthday Lagertha', iconURL: 'https://cdn.discordapp.com/emojis/883271024827830293.gif'})
        .setTimestamp();
        await this.channel.send({embeds: [embed], files: [img]});
    }
    onEnd() {
        if (this.cooldownTimer) clearTimeout(this.cooldownTimer);
        super.onEnd();
    }
}

// exports.game = GobbleWoman;
// exports.id = 'gobblewoman';