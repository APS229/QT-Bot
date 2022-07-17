'use strict';

const { MessageEmbed } = Client.discord;

class DiceDisaster extends Games.Game {
    constructor(interaction) {
        super(interaction);
        this.name = "Dice Disaster";
        this.description = `- When the round starts, you will have 45 seconds to bid a number 1 - 100.\n
        - Use the command \`/bid\` to bid a number.\n
        - After the timer a random number will be chosen from 1 to 100.\n
        - If the highest bidder's bid is equal or lower than the random number, then they will win.\n
        - If the highest bidder's bid is higher than random number, then they will be eliminated.\n
        - The player who survives till 1 player is left also wins.\n
        - Nobody will win and the game will end due to inactivity if no one bids anything.`;
        this.roundTime = 45;
        this.roundTimer = null;
        this.cooldownTime = 5;
        this.cooldownTimer = null;
        this.bidder = { id: '', bid: 0 };
        this.init();
    }
    onStart() {
        super.onStart();
        this.onNextRound();
    }
    onNextRound() {
        this.bidder.id = '';
        this.bidder.bid = 0;
        this.update();
        this.canGuess = true;
        this.roundTimer = setTimeout(() => {
            this.canGuess = false;
            if (this.bidder.id) {
                this.channel.send(`<@${this.bidder.id}> has the highest bid with ${this.bidder.bid}!`);
                this.cooldownTimer = setTimeout(async () => {
                    const roll = parseInt((Math.random() * 100) + 1);
                    await this.channel.send(`Rolling 1 - 100: ${roll}`);
                    if (roll >= this.bidder.bid) {
                        this.winner = this.bidder.id;
                        return this.onEnd();
                    }
                    else {
                        this.channel.send(`RIP! <@${this.bidder.id}> has been eliminated.`);
                        this.onLeave(this.bidder.id);
                        if (this.players.size > 1) this.cooldownTimer = setTimeout(() => this.onNextRound(), this.cooldownTime * 1000);
                    }
                }, this.cooldownTime * 1000);
            }
            else {
                this.channel.send("Nobody bid anything...");
                return this.onEnd();
            }
        }, this.roundTime * 1000);
    }
    onGuess(interaction) {
        const bid = interaction.options._hoistedOptions[0].value;
        if (bid > 100 || bid < 1) return interaction.reply({ content: "Your bid must be a number between 1 - 100.", ephemeral: true });
        if (this.bidder.bid >= bid) return interaction.reply({ content: `<@${this.bidder.id}> has a higher bid with ${this.bidder.bid}!`, ephemeral: true });
        this.bidder.id = interaction.user.id;
        this.bidder.bid = bid;
        interaction.reply(`<@${interaction.user.id}> bid ${bid}!`);
        if (bid === 100) {
            clearTimeout(this.roundTimer);
            this.channel.send(`<@${this.bidder.id}> has the highest bid with ${this.bidder.bid}!`);
            this.cooldownTimer = setTimeout(() => {
                const roll = parseInt((Math.random() * 100) + 1);
                this.channel.send(`Rolling 1 - 100: ${roll}`);
                if (roll >= this.bidder.bid) {
                    this.winner = this.bidder.id;
                    return this.onEnd();
                }
                else {
                    this.channel.send(`RIP! <@${this.bidder.id}> has been eliminated.`);
                    this.onLeave(this.bidder.id);
                    if (this.players.size > 1) this.cooldownTimer = setTimeout(() => this.onNextRound(), this.cooldownTime * 1000);
                }
            }, this.cooldownTime * 1000);
        }
    }
    update() {
        const embed = new MessageEmbed()
            .setTitle("Dice Disaster")
            .setDescription("Bid a number 1 - 100")
            .setTimestamp();
        this.channel.send({ content: Tools.joinList([...this.players.keys()].map(p => '<@' + p + '>')), embeds: [embed] });
    }
    onLeave(userid) {
        super.onLeave(userid);
        if (this.players.size === 1) {
            this.winner = this.players.keys().next().value;
            this.onEnd();
        }
    }
    onEnd() {
        if (this.roundTimer) clearTimeout(this.roundTimer);
        if (this.cooldownTimer) clearTimeout(this.cooldownTimer);
        super.onEnd();
    }
}

exports.game = DiceDisaster;
exports.id = 'dicedisaster';
