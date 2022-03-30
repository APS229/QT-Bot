'use strict';

const colors = ['blue', 'green', 'red', 'yellow'];
const CARDS = [];
const { Permissions } = require('discord.js');

class UNO {
    constructor(channel, server) {
        this.name = 'UNO';
        this.players = new Map();
        this.roles = new Map();
        this.DISCARDED_CARDS = [];
        this.channel = channel;
        this.server = server;
        this.unoRoles = [];
        this.unoChannels = [];
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
        if (!CARDS.length) {
            this.channel.say("Loading cards data since last restart...");
            await this.loadData();
            this.channel.say("Cards data loaded.");
        }
        this.CARDS = [...CARDS];
    }
    async loadData() {
        for (let i = 0; i < colors.length; i++) {
            CARDS.push(colors[i] + ' ' + 0);
            for (let j = 0; j < 2; j++) {
                for (let k = 1; k <= 9; k++) {
                    CARDS.push(colors[i] + ' ' + k);
                }
                CARDS.push(colors[i] + ' ' + '+2');
                CARDS.push(colors[i] + ' ' + 'skip');
                CARDS.push(colors[i] + ' ' + 'reverse');
            }
        }
        for (let i = 0; i < 4; i++) {
            CARDS.push('wild');
            CARDS.push('wild +4');
        }
    }
    async onStart() {
        if (this.players.size < 2) return this.channel.say("There are not enough players to start the game.");
        this.started = true;
        this.channel.say("**The game of UNO is now starting!**");
        const playersLen = Array.from(this.players.keys()).length;
        for (let i = 0; i < playersLen; i++) {
            const unoRole = await this.server.roles.create({
                name: 'UNO Player ' + (i + 1),
                color: 'PURPLE'
            });
            this.unoRoles.push(unoRole);
            const unoChannel = await this.server.channels.create('uno-player-' + (i + 1), {
                parent: '777956702741463071',
                permissionOverwrites: [
                    { id: '777956702741463070', deny: Permissions.FLAGS.VIEW_CHANNEL },
                    { id: unoRole.id, allow: Permissions.FLAGS.VIEW_CHANNEL }
                ]
            })
            this.unoChannels.push(unoChannel);
        }
        this.assignRoles();
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
                    const drawnPlayerCh = this.unoChannels[this.roles.get(drawnPlayer) - 1];
                    for (let i = 0; i < 4; i++) {
                        const drawnCard = this.CARDS.random();
                        this.CARDS.splice(this.CARDS.indexOf(drawnCard), 1);
                        this.players.get(drawnPlayer).push(drawnCard);
                        drawnCards.push(this.format(drawnCard));
                    }
                    this.channel.say(`<@${drawnPlayer}> was forced to draw 4 cards.`);
                    drawnPlayerCh.say(`You were forced to draw: ${drawnCards.join(', ')}`);
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
                        const drawnPlayerCh = this.unoChannels[this.roles.get(drawnPlayer) - 1];
                        for (let i = 0; i < 2; i++) {
                            const drawnCard = this.CARDS.random();
                            this.CARDS.splice(this.CARDS.indexOf(drawnCard), 1);
                            this.players.get(drawnPlayer).push(drawnCard);
                            drawnCards.push(this.format(drawnCard));
                        }
                        this.channel.say(`<@${drawnPlayer}> was forced to draw 2 cards.`);
                        drawnPlayerCh.say(`You were forced to draw: ${drawnCards.join(', ')}`);
                        this.queue.shift();
                        this.queue.push(drawnPlayer);
                        break;
                    case 'skip':
                        const skippedPlayer = this.queue[this.firstCard ? 0 : 1];
                        const skippedPlayerCh = this.unoChannels[this.roles.get(skippedPlayer) - 1];
                        this.channel.say(`<@${skippedPlayer}>'s turn was skipped!`);
                        skippedPlayerCh.say("Your turn was skipped.");
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
        this.channel.say(`<@${this.queue[0]}>'s turn.`);
        this.firstCard = false;
    }
    assignRoles() {
        const players = Array.from(this.players.keys());
        let n = 1;
        while (players.length > 0) {
            const player = players.random();
            this.roles.set(player, n);
            players.splice(players.indexOf(player), 1);
            n++;
        }
        let i = 1;
        for (const player of this.roles.keys()) {
            this.queue.push(player);
            const role = this.unoRoles.find(unoRole => unoRole.name.endsWith(this.roles.get(player)));
            this.server.members.cache.find(m => m.user.id === player).roles.add(role);
            i++;
        }
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
        for (const player of this.roles.keys()) {
            const channel = this.unoChannels.find(unoChannel => unoChannel.name.endsWith(this.roles.get(player)));
            channel.say(`<@${player}> Your cards are: `);
            const cards = [];
            this.players.get(player).forEach(c => cards.push(this.format(c)));
            channel.say(cards.join(', '));
        }
    }
    showPlayers() {
        const players = [];
        for (const player of this.players.keys()) {
            players.push(this.server.members.cache.find(m => m.user.id === player).user.username);
        }
        this.channel.say(`**Players (${players.length}):** ${players.join(', ')}.`);
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
    showTurnOrder() {
        const playerNames = [];
        for (const player of this.queue) {
            playerNames.push(this.server.members.cache.find(m => m.user.id === player).user.username);
        }
        this.channel.say(`Turn order: ${playerNames.join(', ')}`);
        this.channel.say(`Top Card: **${this.format(this.topCard)}**`)
    }
    draw(player) {
        const currentPlayer = this.queue[0];
        const channel = this.unoChannels[this.roles.get(player) - 1];
        if (currentPlayer !== player) return channel.say("It is currently not your turn!");
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
        channel.say(`You have drawn: ${this.format(card)}`);
        this.channel.say(`<@${player}> has drawn a card.`);
        this.showTurnOrder();
        this.channel.say(`<@${this.queue[0]}>'s turn.`);
    }
    play(player, card) {
        card = card.toLowerCase();
        const channel = this.unoChannels[this.roles.get(player) - 1];
        const currentPlayer = this.queue[0];
        const cardName = card.split(' ')[0];
        const cardValue = card.split(' ')[1];
        const thirdValue = card.split(' ')[2];
        const topCardName = this.topCard.split(' ')[0];
        const topCardValue = this.topCard.split(' ')[1];
        if (currentPlayer !== player) return channel.say("It is currently not your turn!");
        if (!CARDS.includes(card) || !this.players.get(player).includes(card)) {
            if (!card.startsWith('wild +4') && !card.startsWith('wild')) return channel.say("Invalid card.")
            if (thirdValue && !colors.includes(thirdValue)) return channel.say("Invalid color. Format ``.play Wild +4 [color]``");
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
                    if (!thirdValue || !colors.includes(thirdValue) && !!channel) return channel.say("You must specify a valid color (format: ``.play wild +4 [color]``");
                    this.topCard = card;
                    this.DISCARDED_CARDS.push(cardName + ' ' + cardValue);
                    const drawnCards = [];
                    const drawnPlayer = this.queue[this.firstCard ? 0 : 1];
                    const drawnPlayerCh = this.unoChannels[this.roles.get(drawnPlayer) - 1];
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
                    drawnPlayerCh.say(`You were forced to draw: ${drawnCards.join(', ')}`);
                    this.queue.shift();
                    this.queue.push(currentPlayer);
                    this.queue.shift();
                    this.queue.push(drawnPlayer);
                    this.topCard = thirdValue;
                    this.players.get(player).splice(this.players.get(player).indexOf('wild +4'), 1)
                }
                else if (channel) {
                    return channel.say("You must specify a valid card value.");
                }
                break;
            case 'red':
            case 'yellow':
            case 'blue':
            case 'green':
                if (!cardValue) return channel.say("Usage: ``.play wild +4 [color]``");
                if (topCardName !== cardName && topCardValue !== cardValue) return channel.say("The card must match the color or the value with the top card.");
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
                        const drawnPlayerCh = this.unoChannels[this.roles.get(drawnPlayer) - 1];
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
                        drawnPlayerCh.say(`You were forced to draw: ${drawnCards.join(', ')}`);
                        this.queue.shift();
                        this.queue.push(currentPlayer);
                        this.queue.shift();
                        this.queue.push(drawnPlayer);
                        break;
                    case 'skip':
                        const skippedPlayer = this.queue[this.firstCard ? 0 : 1];
                        const skippedPlayerCh = this.unoChannels[this.roles.get(skippedPlayer) - 1];
                        this.channel.say(`<@${skippedPlayer}>'s turn was skipped!`);
                        skippedPlayerCh.say("Your turn was skipped.");
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
        channel.say(`You have played: ${this.format(card)}`);
        this.channel.say(`<@${player}> has played ${this.format(card)}.`);
        this.showTurnOrder();
        if (!this.players.get(player).length) {
            this.winner = player;
            return this.onEnd();
        }
        this.channel.say(`<@${this.queue[0]}>'s turn.`);
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
        this.showTurnOrder();
        this.channel.say(`<@${this.queue[0]}>'s turn!`);
    }
    showHand(player) {
        const channel = this.unoChannels[this.roles.get(player) - 1];
        const cards = [];
        this.players.get(player).forEach(c => cards.push(this.format(c)));
        channel.say(`Your current hand: ${cards.join(', ')}.`);
    }
    onEnd() {
        this.channel.say("**The game of UNO has ended.**");
        if (this.winner) this.channel.say(`**Congratulations to <@${this.winner}> for winning the UNO game!**`);
        if (this.started) {
            for (const unoRole of this.unoRoles) {
                unoRole.delete();
            }
            for (const unoChannel of this.unoChannels) {
                unoChannel.delete();
            }
        }
        delete this.channel.game;
    }
}

exports.game = UNO;
exports.id = 'uno';
