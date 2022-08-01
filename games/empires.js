'use strict';

const { MessageEmbed } = Client.discord;

class Empires extends Games.Game {
    constructor(interaction) {
        super(interaction);
        this.name = 'Empires';
        this.description = `- Don't tell others your alias, make it less obvious.\n
        - You will have 60 seconds to choose your alias using the \`/alias\` command before the game starts.\n
        - **On your turn only**, use \`/guessalias\` command to guess someone with an alias.\n
        - If correct, you will get to guess one more person.\n
        - If incorrect, the person you tried to guess will get a turn.
        - The one to survive until the end will be the winner.`;
        this.aliases = new Map();
        this.turn = null;
        this.requiredPlayers = 5;
        this.playerTime = 45;
        this.roundTime = 60;
        this.cooldownTime = 5;
        this.setAliases = false;
        this.init();
    }
    async onStart() {
        await super.onStart();
        this.channel.send("Everyone go ahead and choose your alias with `/alias` command, you have 60 seconds left.")
        this.roundTimer = setTimeout(async () => {
            for (const player of this.players.keys()) {
                if (!this.aliases.has(player)) {
                    this.channel.send(`<@${player}> didn't choose an alias in time and has been eliminated.`);
                    await this.onLeave(player);
                }
            }
            if (this.players.size === 0) {
                return this.onEnd();
            }
            this.turn = [...this.players.keys()].random();
            if (this.players.size === 1) {
                this.winner = this.turn;
                return this.onEnd();
            }
            let randomized = [...this.aliases].shuffle();
            this.aliases = new Map(randomized);
            randomized = [...this.players].shuffle();
            this.players = new Map(randomized);
            this.setAliases = true;
            this.onNextRound();
        }, this.roundTime * 1000);
    }
    setAlias(userid, alias) {
        this.aliases.set(userid, alias);
    }
    onNextRound() {
        if (this.playerTimer) clearTimeout(this.playerTimer);
        this.update();
        this.playerTimer = setTimeout(async () => {
            this.players.delete(this.turn);
            await this.channel.send(`<@${this.turn}> didn't respond in time and has been eliminated! Their alias was: ${this.aliases.get(this.turn)}`);
            this.aliases.delete(this.turn);
            this.turn = [...this.players.keys()].random();
            if (this.players.size === 1) {
                this.winner = this.turn;
                return this.onEnd();
            }
            this.onNextRound()
        }, this.playerTime * 1000);
    }
    async onGuess(interaction) {
        if (this.turn !== interaction.user.id) return interaction.reply({ content: "It's not your turn.", ephemeral: true });
        const userid = interaction.options._hoistedOptions[0].user.id, alias = Tools.toId(interaction.options._hoistedOptions[1].value);
        if (userid === interaction.user.id) return interaction.reply("You cannot guess your own self...");
        if (![...this.aliases.values()].includes(alias)) return interaction.reply("Not an alias.");
        if (!this.players.has(userid)) return interaction.reply("User not in game.");
        clearTimeout(this.playerTimer);
        if (this.aliases.get(userid) === alias) {
            await interaction.reply(`Correct! <@${userid}> (${alias}) has been eliminated.`);
            this.players.delete(userid);
            this.aliases.delete(userid);
            if (this.players.size === 1) {
                this.winner = interaction.user.id;
                return this.onEnd();
            }
            this.cooldownTimer = setTimeout(() => this.onNextRound(), this.cooldownTime * 1000);
        }
        else {
            interaction.reply("Incorrect...");
            this.turn = userid;
            this.cooldownTimer = setTimeout(() => this.onNextRound(), this.cooldownTime * 1000);
        }
    }
    async onLeave(userid) {
        await super.onLeave(userid);
        if (this.aliases.has(userid)) {
            this.channel.send(`Their alias was: ${this.aliases.get(userid)}`);
            this.aliases.delete(userid);
        }
        if (this.players.size === 1 && this.setAliases) {
            this.winner = this.players.keys().next().value;
            return this.onEnd();
        }
    }
    update() {
        let players = "", aliases = [...this.aliases.values()].join('\n\n');
        for (const player of this.players.keys()) {
            players += `<@${player}>\n\n`;
        }
        const embed = new MessageEmbed()
            .setColor("#FFFFFF")
            .setTitle("Empires")
            .addField("__Players__", players, true)
            .addField("__Aliases__", aliases, true)
            .setTimestamp();
        this.channel.send({ content: `<@${this.turn}>'s turn!`, embeds: [embed] });
    }
    onEnd() {
        if (this.playerTimer) clearTimeout(this.playerTimer);
        if (this.cooldownTimer) clearTimeout(this.cooldownTimer);
        super.onEnd();
    }
}

exports.game = Empires;
exports.id = 'empires';