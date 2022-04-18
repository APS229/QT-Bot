'use strict';

const colors = ['blue', 'green', 'red', 'yellow'];
const { Permissions, MessageActionRow, MessageButton, MessageSelectMenu, MessageAttachment, MessageEmbed } = Client.discord;

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
        this.updateStr = "None";
        this.winners = [];
        this.queue = [];
        this.topCard = null;
        this.prevPlayer = '';
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
        this.timer = setTimeout(() => {
            const players = [...this.players.entries()];
            this.channel.say("**(UNO) TIME'S UP!**");
            this.winners = players.slice(0, players.sort((a, b) => a[1].cards.length - b[1].cards.length).map(v => v[1].cards.length === players[0][1].cards.length).lastIndexOf(true) + 1).map(v => v = v[0]);
            this.onEnd();
        }, 10 * 60 * 1000);
        this.channel.say("**The game of UNO is now starting!**");
        this.assignCards();
        let card = this.CARDS.random();
        this.CARDS.splice(this.CARDS.indexOf(card), 1);
        this.DISCARDED_CARDS.push(card);
        if (card.startsWith('wild')) card += ' ' + colors.random();
        this.topCard = card;
        this.updateStr = `The top card is: **${this.format(this.topCard)}**\n\n`;
        const cardName = card.split(' ')[0];
        const cardValue = card.split(' ')[1];
        const thirdValue = card.split(' ')[2];
        switch (cardName) {
            case 'wild':
                if (colors.includes(cardValue)) this.topCard = cardValue;
                else if (cardValue === '+4') {
                    const drawnCards = [];
                    const drawnPlayer = this.queue[this.firstCard ? 0 : 1];
                    for (let i = 0; i < 4; i++) {
                        const drawnCard = this.CARDS.random();
                        this.CARDS.splice(this.CARDS.indexOf(drawnCard), 1);
                        this.players.get(drawnPlayer).cards.push(drawnCard);
                        drawnCards.push(this.format(drawnCard));
                    }
                    this.players.get(drawnPlayer).uno = false;
                    this.updateStr += `<@${drawnPlayer}> was forced to draw 4 cards.`;
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
                            this.players.get(drawnPlayer).cards.push(drawnCard);
                            drawnCards.push(this.format(drawnCard));
                        }
                        this.players.get(drawnPlayer).uno = false;
                        this.updateStr += `<@${drawnPlayer}> was forced to draw 2 cards.`;
                        this.queue.shift();
                        this.queue.push(drawnPlayer);
                        break;
                    case 'skip':
                        const skippedPlayer = this.queue[this.firstCard ? 0 : 1];
                        this.updateStr += `<@${skippedPlayer}>'s turn was skipped!`;
                        this.queue.shift();
                        this.queue.push(skippedPlayer);
                        break;
                    case 'reverse':
                        this.queue.reverse();
                        this.updateStr += "The turn order was reversed!";
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
            this.players.set(player, { uno: false, cards: cards });
        }
        for (const player of this.players.keys()) {
            const cards = [];
            this.queue.push(player);
            this.players.get(player).cards.forEach(c => cards.push(this.format(c)));
        }
        this.queue.shuffle();
    }
    showPlayers() {
        const players = [];
        for (const player of this.players.keys()) {
            players.push(this.server.members.cache.find(m => m.user.id === player).displayName);
        }
        this.channel.say(`**Players (${players.length}):** ${players.length ? players.join(', ') : 'none'}`);
    }
    format(card) {
        card = Tools.toTitleCase(card);
        if (card.startsWith('Blue')) {
            return '🔵 ' + card;
        }
        else if (card.startsWith('Green')) {
            return '🟢 ' + card;
        }
        else if (card.startsWith('Red')) {
            return '🔴 ' + card;
        }
        else if (card.startsWith('Yellow')) {
            return '🟡 ' + card;
        }
        // wild cards only
        else {
            return '⚫ ' + card;
        }
    }
    draw(interaction) {
        const currentPlayer = this.queue[0];
        const player = interaction.user.id;
        if (currentPlayer !== player) return interaction.reply({ content: "It is currently not your turn!", ephemeral: true });
        if (!this.CARDS.length) {
            this.DISCARDED_CARDS.splice(this.DISCARDED_CARDS.indexOf(this.topCard.split(' ')[0] + ' ' + this.topCard.split(' ')[1]), 1);
            this.CARDS = [...this.DISCARDED_CARDS];
            this.DISCARDED_CARDS = [this.topCard.split(' ')[0] + ' ' + this.topCard.split(' ')[1]];
        }
        const card = this.CARDS.random();
        this.players.get(player).cards.push(card);
        this.CARDS.splice(this.CARDS.indexOf(card), 1);
        this.queue.shift();
        this.queue.push(currentPlayer);
        this.players.get(player).uno = false;
        interaction.reply({ content: `You have drawn: ${this.format(card)}`, ephemeral: true });
        this.updateStr = `<@${player}> has drawn a card.`;
        this.prevPlayer = player;
        this.update();
    }
    play(interaction) {
        let card = '';
        if (interaction.isButton()) {
            const menuOptions = [], rows = [], playerCards = this.players.get(interaction.user.id).cards;
            for (let i = 0; i < playerCards.length; i++) menuOptions.push({ label: this.format(playerCards[i]), value: playerCards[i] + ' ' + i });
            for (let i = 0; i < menuOptions.length; i += 25) {
                const to = i + 25 > menuOptions ? menuOptions.length : i + 25;
                rows.push(
                    new MessageActionRow()
                        .addComponents(
                            new MessageSelectMenu()
                                .setCustomId('play' + i)
                                .setPlaceholder('Select a card')
                                .setOptions(menuOptions.slice(i, to))
                        )
                );
            }
            return interaction.reply({ components: rows, ephemeral: true });
        }
        else if (interaction.isCommand()) card = interaction.options.get('card').value.toLowerCase();
        else if (interaction.isSelectMenu()) {
            card = interaction.values[0].split(' ').slice(0, interaction.values[0].split(' ').length - 1).join(' ');
            if (interaction.customId === 'play_wild') card = interaction.values[0];
            else if (card.startsWith('wild')) {
                const menuOptions = [];
                for (const color of colors) menuOptions.push({ label: this.format(card + ' ' + color), value: card + ' ' + color });
                const row = new MessageActionRow()
                    .addComponents(
                        new MessageSelectMenu()
                            .setCustomId('play_wild')
                            .setPlaceholder('Select a color')
                            .setOptions(menuOptions)
                    )
                return interaction.reply({ components: [row], ephemeral: true });
            }
        }
        const currentPlayer = this.queue[0];
        const player = interaction.user.id;
        if (currentPlayer !== interaction.user.id) return interaction.reply({ content: "It is currently not your turn!", ephemeral: true });
        const cardName = card.split(' ')[0];
        const cardValue = card.split(' ')[1];
        const thirdValue = card.split(' ')[2];
        const topCardName = this.topCard.split(' ')[0];
        const topCardValue = this.topCard.split(' ')[1];
        if (!Client.CARDS.includes(card) || !this.players.get(player).cards.includes(card)) {
            if (!card.startsWith('wild +4') && !card.startsWith('wild')) return interaction.reply({ content: "Invalid card.", ephemeral: true })
            if (thirdValue && !colors.includes(thirdValue)) return interaction.reply({ content: "Invalid color. Format ``.play Wild [color]`` / ``.play Wild +4 [color]``", ephemeral: true });
        }
        switch (cardName) {
            case 'wild':
                if (colors.includes(cardValue)) {
                    this.topCard = cardValue;
                    this.queue.shift();
                    this.queue.push(currentPlayer);
                    this.players.get(player).cards.splice(this.players.get(player).cards.indexOf('wild'), 1)
                }
                else if (cardValue === '+4') {
                    if (!thirdValue || !colors.includes(thirdValue) && !!channel) return interaction.reply({ content: "You must specify a valid color", ephemeral: true });
                    this.topCard = card;
                    this.DISCARDED_CARDS.push(cardName + ' ' + cardValue);
                    const drawnCards = [];
                    const drawnPlayer = this.queue[this.firstCard ? 0 : 1];
                    this.updateStr = `<@${drawnPlayer}> was forced to draw 4 cards.`;
                    this.players.get(drawnPlayer).uno = false;
                    for (let i = 0; i < 4; i++) {
                        const drawnCard = this.CARDS.random();
                        this.CARDS.splice(this.CARDS.indexOf(drawnCard), 1);
                        if (!this.CARDS.length) {
                            this.DISCARDED_CARDS.splice(this.DISCARDED_CARDS.indexOf(cardName + ' ' + cardValue), 1);
                            this.CARDS = [...this.DISCARDED_CARDS];
                            this.DISCARDED_CARDS = [topCardName + ' ' + topCardValue];
                        }
                        this.players.get(drawnPlayer).cards.push(drawnCard);
                        drawnCards.push(this.format(drawnCard));
                    }
                    this.queue.shift();
                    this.queue.push(currentPlayer);
                    this.queue.shift();
                    this.queue.push(drawnPlayer);
                    this.topCard = thirdValue;
                    this.players.get(player).cards.splice(this.players.get(player).cards.indexOf('wild +4'), 1)
                }
                else {
                    return interaction.reply({ content: "You must specify a valid card value.", ephemeral: true });
                }
                break;
            case 'red':
            case 'yellow':
            case 'blue':
            case 'green':
                if (!cardValue) return interaction.reply({ content: "Invalid card.", ephemeral: true });
                if (topCardName !== cardName && topCardValue !== cardValue) return interaction.reply({ content: "The card must match the color or the value with the top card.", ephemeral: true });
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
                            this.players.get(drawnPlayer).cards.push(drawnCard);
                            drawnCards.push(this.format(drawnCard));
                        }
                        this.players.get(drawnPlayer).uno = false;
                        this.updateStr = `<@${drawnPlayer}> was forced to draw 2 cards.`;
                        this.queue.shift();
                        this.queue.push(currentPlayer);
                        this.queue.shift();
                        this.queue.push(drawnPlayer);
                        break;
                    case 'skip':
                        const skippedPlayer = this.queue[this.firstCard ? 0 : 1];
                        this.updateStr = `<@${skippedPlayer}>'s turn was skipped!`;
                        this.queue.shift();
                        this.queue.push(currentPlayer);
                        this.queue.shift();
                        this.queue.push(skippedPlayer);
                        break;
                    case 'reverse':
                        this.queue.reverse();
                        this.updateStr = "The turn order was reversed!";
                        break;
                }
                if (!!player) this.players.get(player).cards.splice(this.players.get(player).cards.indexOf(card), 1);
                break;
        }
        this.updateStr = `<@${player}> has played ${this.format(card)}.${this.updateStr !== 'None' ? '\n\n' + this.updateStr : ''}`;
        if (this.players.get(this.prevPlayer)?.cards.length === 1 && !this.players.get(this.prevPlayer)?.uno) {
            const drawnCards = [];
            for (let i = 0; i < 2; i++) {
                const drawnCard = this.CARDS.random();
                this.CARDS.splice(this.CARDS.indexOf(drawnCard), 1);
                if (!this.CARDS.length) {
                    this.DISCARDED_CARDS.splice(this.DISCARDED_CARDS.indexOf(cardName + ' ' + cardValue), 1);
                    this.CARDS = [...this.DISCARDED_CARDS];
                    this.DISCARDED_CARDS = [topCardName + ' ' + topCardValue];
                }
                this.players.get(this.prevPlayer).cards.push(drawnCard);
                drawnCards.push(this.format(drawnCard));
            }
            this.updateStr = `<@${this.prevPlayer}> forgot to click UNO! and was forced to draw 2 cards.\n\n${this.updateStr}`;
        }
        if (!this.players.get(player).cards.length) {
            this.winners = [player];
            return this.onEnd();
        }
        this.prevPlayer = player;
        this.update();
    }
    disqualify(players) {
        for (const player of players) {
            for (const card of this.players.get(player).cards) {
                this.DISCARDED_CARDS.push(card);
            }
            this.players.delete(player);
            this.queue.splice(this.queue.indexOf(player), 1);
        }
        if (this.queue.length < 2) {
            this.winners = [this.queue[0]];
            return this.onEnd();
        }
        this.update();
    }
    showHand(player) {
        const cards = [];
        this.players.get(player).cards.forEach(c => cards.push(this.format(c)));
        return `Your current hand: ${cards.join(', ')}`;
    }
    async update() {
        if (this.message) await this.message.delete();
        const topCardColor = this.topCard.split(' ')[0];
        const img = new MessageAttachment(`./images/${topCardColor}.png`);
        const embed = new MessageEmbed()
            .setColor(topCardColor.toUpperCase())
            .setTitle('UNO')
            .setThumbnail(`attachment://${topCardColor}.png`)
            .addField('__Top card__', this.format(this.topCard))
            .addField(`__Players(${this.players.size})__`, this.queue.map(u => u = `<@${u}> (${this.players.get(u).cards.length})`)/*.map(u => {
                if (this.queue.indexOf(u) === 0) u = '***** ' + u;
            })*/.join('\n'))
            .addField('__Logs__', this.updateStr)
            .addField('__Information__', `- Click the Play button or use the command \`\`/play card: [card]\`\` to play a card.\n
            - Click the Hand button or use the command \`\`/hand\`\` to check your cards.\n
            - Click the Draw button or use the command \`\`/draw\`\` if you don't have a card to play.\n
            - Click the UNO button or use the command \`\`/uno\`\` if you have 1 card left.`)
            .setTimestamp()
            .setFooter({ text: Config.username, iconURL: Config.avatarURL });
        this.updateStr = "None";
        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('play')
                    .setLabel('Play')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId('hand')
                    .setLabel('Hand')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId('draw')
                    .setLabel('Draw')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId('uno')
                    .setLabel('UNO!')
                    .setStyle('SUCCESS')
            );
        this.message = await this.channel.send({ content: `<@${this.queue[0]}>'s turn!`, embeds: [embed], components: [row], files: [img] });
    }
    onEnd() {
        if (this.message) {
            const components = this.message.components;
            for (const button of components[0].components) button.disabled = true;
            this.message.edit({ content: '**The game of UNO has ended.**', components: components });
        }
        if (this.timer) clearTimeout(this.timer);
        if (this.winners.length) this.channel.say(`**Congratulations to ${this.winners.map(w => w = '<@' + w + '>').join(', ')} for winning the UNO game!**`);
        delete Client.activeGame;
    }
}

exports.game = UNO;
exports.id = 'uno';
