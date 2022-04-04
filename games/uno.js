'use strict';

const colors = ['blue', 'green', 'red', 'yellow'];
const { Permissions, MessageActionRow, MessageButton, MessageAttachment, MessageEmbed } = Client.discord;

class UNO {
    constructor(channel, server) {
        this.name = 'UNO';
        this.players = new Map();
        this.roles = new Map();
        this.DISCARDED_CARDS = [];
        this.channel = channel;
        this.server = server;
        this.started = false;
        this.firstCard = true;
        this.winner = null;
        this.queue = [];
        this.topCard = null;
        this.init();
    }
    async init() {
        await this.loadCards();
        this.channel.say("**A new game of UNO has been created! Use the command ``.join`` to join the game.**");
    }
    async loadCards() {
        if (!Client.CARDS) {
            this.channel.say("Loading cards data since last restart...");
            await this.loadData();
            this.channel.say("Cards data loaded.");
        }
        this.CARDS = [...Client.CARDS];
    }
    async loadData() {
        Client.CARDS = [];
        for (let i = 0; i < colors.length; i++) {
            Client.CARDS.push(colors[i] + ' ' + 0);
            for (let j = 0; j < 2; j++) {
                for (let k = 1; k <= 9; k++) {
                    Client.CARDS.push(colors[i] + ' ' + k);
                }
                Client.CARDS.push(colors[i] + ' ' + '+2');
                Client.CARDS.push(colors[i] + ' ' + 'skip');
                Client.CARDS.push(colors[i] + ' ' + 'reverse');
            }
        }
        for (let i = 0; i < 4; i++) {
            Client.CARDS.push('wild');
            Client.CARDS.push('wild +4');
        }
    }
    async onStart() {
        if (this.players.size < 2) return this.channel.say("There are not enough players to start the game.");
        this.started = true;
        this.channel.say("**The game of UNO is now starting!**");
        this.assignCards();
        let card = this.CARDS.random();
        this.CARDS.splice(this.CARDS.indexOf(card), 1);
        this.DISCARDED_CARDS.push(card);
        if (card.startsWith('wild')) card += ' ' + colors.random();
        this.topCard = card;
        this.channel.say(`The top card is: **${this.format(this.topCard)}**`);
        const cardName = card.split(' ')[0];
        const cardValue = card.split(' ')[1];
        const thirdValue = card.split(' ')[2];
        switch (cardName) {
            case 'wild':
                if (colors.includes(cardValue)) {
                    this.topCard = cardValue;
                }
                else if (cardValue === '+4') {
                    const drawnCards = [];
                    const drawnPlayer = this.queue[this.firstCard ? 0 : 1];
                    for (let i = 0; i < 4; i++) {
                        const drawnCard = this.CARDS.random();
                        this.CARDS.splice(this.CARDS.indexOf(drawnCard), 1);
                        this.players.get(drawnPlayer).push(drawnCard);
                        drawnCards.push(this.format(drawnCard));
                    }
                    this.channel.say(`<@${drawnPlayer}> was forced to draw 4 cards.`);
                    this.queue.shift();
                    this.queue.push(drawnPlayer);
                    this.topCard = thirdValue;
                }
                break;
            case 'red':
            case 'yellow':
            case 'blue':
            case 'green':
                switch (cardValue) {
                    case '+2':
                        const drawnCards = [];
                        const drawnPlayer = this.queue[this.firstCard ? 0 : 1];
                        for (let i = 0; i < 2; i++) {
                            const drawnCard = this.CARDS.random();
                            this.CARDS.splice(this.CARDS.indexOf(drawnCard), 1);
                            this.players.get(drawnPlayer).push(drawnCard);
                            drawnCards.push(this.format(drawnCard));
                        }
                        this.channel.say(`<@${drawnPlayer}> was forced to draw 2 cards.`);
                        this.queue.shift();
                        this.queue.push(drawnPlayer);
                        break;
                    case 'skip':
                        const skippedPlayer = this.queue[this.firstCard ? 0 : 1];
                        this.channel.say(`<@${skippedPlayer}>'s turn was skipped!`);
                        this.queue.shift();
                        this.queue.push(skippedPlayer);
                        break;
                    case 'reverse':
                        this.queue.reverse();
                        this.channel.say("The turn order was reversed!");
                        break;
                }
                break;
        }
        this.update();
        this.firstCard = false;
    }
    assignCards() {
        for (const player of this.players.keys()) {
            const cards = [];
            for (let i = 0; i < 5; i++) {
                const card = this.CARDS.random();
                cards.push(card);
                this.CARDS.splice(this.CARDS.indexOf(card), 1);
            }
            this.players.set(player, cards);
        }
        for (const player of this.players.keys()) {
            const cards = [];
            this.queue.push(player);
            this.players.get(player).forEach(c => cards.push(this.format(c)));
        }
    }
    showPlayers() {
        const players = [];
        for (const player of this.players.keys()) {
            players.push(this.server.members.cache.find(m => m.user.id === player).user.username);
        }
        this.channel.say(`**Players (${players.length}):** ${players.length ? players.join(', ') : 'none'}`);
    }
    format(card) {
        card = Tools.toTitleCase(card);
        if (card.startsWith('Blue')) {
            return ':blue_circle: ' + card;
        }
        else if (card.startsWith('Green')) {
            return ':green_circle: ' + card;
        }
        else if (card.startsWith('Red')) {
            return ':red_circle: ' + card;
        }
        else if (card.startsWith('Yellow')) {
            return ':yellow_circle: ' + card;
        }
        // wild cards only
        else {
            return ':black_circle: ' + card;
        }
    }
    draw(interaction) {
        const currentPlayer = this.queue[0];
        const player = interaction.user.id;
        if (currentPlayer !== player) return this.channel.say("It is currently not your turn!");
        if (!this.CARDS.length) {
            this.DISCARDED_CARDS.splice(this.DISCARDED_CARDS.indexOf(this.topCard.split(' ')[0] + ' ' + this.topCard.split(' ')[1]), 1);
            this.CARDS = [...this.DISCARDED_CARDS];
            this.DISCARDED_CARDS = [this.topCard.split(' ')[0] + ' ' + this.topCard.split(' ')[1]];
        }
        const card = this.CARDS.random();
        this.players.get(player).push(card);
        this.CARDS.splice(this.CARDS.indexOf(card), 1);
        this.queue.shift();
        this.queue.push(currentPlayer);
        interaction.reply({ content: `You have drawn: ${this.format(card)}`, ephemeral: true });
        this.channel.say(`<@${player}> has drawn a card.`);
        this.update();
    }
    play(player, card) {
        card = card.toLowerCase();
        const currentPlayer = this.queue[0];
        const cardName = card.split(' ')[0];
        const cardValue = card.split(' ')[1];
        const thirdValue = card.split(' ')[2];
        const topCardName = this.topCard.split(' ')[0];
        const topCardValue = this.topCard.split(' ')[1];
        if (currentPlayer !== player) return this.channel.say("It is currently not your turn!");
        if (!Client.CARDS.includes(card) || !this.players.get(player).includes(card)) {
            if (!card.startsWith('wild +4') && !card.startsWith('wild')) return this.channel.say("Invalid card.")
            if (thirdValue && !colors.includes(thirdValue)) return this.channel.say("Invalid color. Format ``.play Wild +4 [color]``");
        }
        switch (cardName) {
            case 'wild':
                if (colors.includes(cardValue)) {
                    this.topCard = cardValue;
                    this.queue.shift();
                    this.queue.push(currentPlayer);
                    this.players.get(player).splice(this.players.get(player).indexOf('wild'), 1)
                }
                else if (cardValue === '+4') {
                    if (!thirdValue || !colors.includes(thirdValue) && !!channel) return this.channel.say("You must specify a valid color (format: ``.play wild +4 [color]``");
                    this.topCard = card;
                    this.DISCARDED_CARDS.push(cardName + ' ' + cardValue);
                    const drawnCards = [];
                    const drawnPlayer = this.queue[this.firstCard ? 0 : 1];
                    this.channel.say(`<@${drawnPlayer}> was forced to draw 4 cards.`);
                    for (let i = 0; i < 4; i++) {
                        const drawnCard = this.CARDS.random();
                        this.CARDS.splice(this.CARDS.indexOf(drawnCard), 1);
                        if (!this.CARDS.length) {
                            this.DISCARDED_CARDS.splice(this.DISCARDED_CARDS.indexOf(cardName + ' ' + cardValue), 1);
                            this.CARDS = [...this.DISCARDED_CARDS];
                            this.DISCARDED_CARDS = [topCardName + ' ' + topCardValue];
                        }
                        this.players.get(drawnPlayer).push(drawnCard);
                        drawnCards.push(this.format(drawnCard));
                    }
                    this.queue.shift();
                    this.queue.push(currentPlayer);
                    this.queue.shift();
                    this.queue.push(drawnPlayer);
                    this.topCard = thirdValue;
                    this.players.get(player).splice(this.players.get(player).indexOf('wild +4'), 1)
                }
                else {
                    return this.channel.say(`<@${currentPlayer}>: you must specify a valid card value.`);
                }
                break;
            case 'red':
            case 'yellow':
            case 'blue':
            case 'green':
                if (!cardValue) return this.channel.say("Usage: ``.play wild +4 [color]``");
                if (topCardName !== cardName && topCardValue !== cardValue) return this.channel.say("The card must match the color or the value with the top card.");
                this.topCard = card;
                this.DISCARDED_CARDS.push(cardName + ' ' + cardValue);
                switch (cardValue) {
                    case '0':
                    case '1':
                    case '2':
                    case '3':
                    case '4':
                    case '5':
                    case '6':
                    case '7':
                    case '8':
                    case '9':
                        this.queue.shift();
                        this.queue.push(currentPlayer);
                        break;
                    case '+2':
                        const drawnCards = [];
                        const drawnPlayer = this.queue[this.firstCard ? 0 : 1];
                        for (let i = 0; i < 2; i++) {
                            const drawnCard = this.CARDS.random();
                            this.CARDS.splice(this.CARDS.indexOf(drawnCard), 1);
                            if (!this.CARDS.length) {
                                this.DISCARDED_CARDS.splice(this.DISCARDED_CARDS.indexOf(cardName + ' ' + cardValue), 1);
                                this.CARDS = [...this.DISCARDED_CARDS];
                                this.DISCARDED_CARDS = [topCardName + ' ' + topCardValue];
                            }
                            this.players.get(drawnPlayer).push(drawnCard);
                            drawnCards.push(this.format(drawnCard));
                        }
                        this.channel.say(`<@${drawnPlayer}> was forced to draw 2 cards.`)
                        this.queue.shift();
                        this.queue.push(currentPlayer);
                        this.queue.shift();
                        this.queue.push(drawnPlayer);
                        break;
                    case 'skip':
                        const skippedPlayer = this.queue[this.firstCard ? 0 : 1];
                        this.channel.say(`<@${skippedPlayer}>'s turn was skipped!`);
                        this.queue.shift();
                        this.queue.push(currentPlayer);
                        this.queue.shift();
                        this.queue.push(skippedPlayer);
                        break;
                    case 'reverse':
                        this.queue.reverse();
                        this.channel.say("The turn order was reversed!");
                        break;
                }
                if (!!player) this.players.get(player).splice(this.players.get(player).indexOf(card), 1);
                break;
        }
        this.channel.say(`<@${player}> has played ${this.format(card)}.`);
        if (!this.players.get(player).length) {
            this.winner = player;
            return this.onEnd();
        }
        this.update();
    }
    disqualify(players) {
        for (const player of players) {
            for (const card of this.players.get(player)) {
                this.DISCARDED_CARDS.push(card);
            }
            this.players.delete(player);
            this.queue.splice(this.queue.indexOf(player), 1);
        }
        if (this.queue.length < 2) {
            this.winner = this.queue[0];
            return this.onEnd();
        }
        this.update();
    }
    showHand(player) {
        const cards = [];
        this.players.get(player).forEach(c => cards.push(this.format(c)));
        return `Your current hand: ${cards.join(', ')}`;
    }
    async update() {
        if (this.message) this.message.delete();
        const topCardColor = this.topCard.split(' ')[0];
        const img = new MessageAttachment(`./images/${topCardColor}.png`);
        const embed = new MessageEmbed()
            .setColor(topCardColor.toUpperCase())
            .setTitle('UNO')
            .setThumbnail(`attachment://${topCardColor}.png`)
            .addField('__Top card__', this.format(this.topCard))
            .addField(`__Players(${this.players.size})__`, Array.from(this.players.keys()).map(u => u = '<@' + u + '>').join('\n'))
            .addField('__Information__', `1) Click the Hand button or use the command \`\`/hand\`\` to check your cards.\n
            2) Click the UNO button or use the command \`\`/uno\`\` if you have 1 card left.\n
            3) Bully WAF 24/7.`)
            .setTimestamp()
            .setFooter({ text: Config.username, iconURL: Config.avatarURL });
        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('hand')
                    .setLabel('Hand')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId('draw')
                    .setLabel('Draw')
                    .setStyle('PRIMARY'),
                // new MessageButton()
                //     .setCustomId('uno')
                //     .setLabel('UNO')
                //     .setStyle('SUCCESS')
            );
        this.message = await this.channel.send({ content: `<@${this.queue[0]}>'s turn!`, embeds: [embed], components: [row], files: [img], ephemeral: true });
    }
    onEnd() {
        const components = this.message.components;
        for (const button of components[0].components) button.disabled = true;
        this.message.edit({ content: '**The game of UNO has ended.**', components: components});
        if (this.winner) this.channel.say(`**Congratulations to <@${this.winner}> for winning the UNO game!**`);
        delete Client.activeGame;
    }
}

exports.game = UNO;
exports.id = 'uno';
