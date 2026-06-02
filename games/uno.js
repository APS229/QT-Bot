'use strict';

const colors = ['blue', 'green', 'red', 'yellow'];
const { Permissions, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');

class UNO extends Games.Game {
    constructor(interaction) {
        super(interaction);
        this.name = "UNO";
        // TODO: add a description
        // this.description = ``;
        this.deck = [];
        this.discardPile = [];
        this.firstTurn = true;
        this.actions = "";
        this.queue = [];
        this.prevPlayer = '';
        this.topCard = '';
        this.topCardColor = '';
        this.playerTime = 30;
        this.playerTimer = null;
        this.init();
    }
    async loadData() {
        if (!Client.CARDS) {
            const message = await this.channel.send("Loading cards data since last restart...");
            await this.loadCards();
            message.edit("Cards data loaded.");
        }
        this.deck = [...Client.CARDS];
    }
    async loadCards() {
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
        super.onStart();
        for (const player of this.players.keys()) {
            this.players.set(player, { uno: false, hand: [] });
            this.queue.push(player);
        }
        this.queue = this.queue.shuffle();

        this.assignCards();
        this.onNextRound();
    }
    assignCards() {
        for (const player of this.players.keys()) {
            this.drawCards(player, 2);
        }
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
        // Wild cards only
        else {
            return '⚫ ' + card;
        }
    }
    async onNextRound() {
        if (!this.started) return;
        if (this.playerTimer) clearTimeout(this.playerTimer);
        if (this.firstTurn) {
            let card = this.deck.random();
            this.topCard = card;
            if (card.startsWith('wild')) {
                this.topCardColor = colors.random();
                card += ` ${this.topCardColor}`;
            }
            this.channel.send(`The top card is: **${this.format(card)}**`);
            this.playCard(card);
            this.firstTurn = false;
        }

        if (this.playerTimer) clearTimeout(this.playerTimer);
        if (this.actions) this.channel.send(this.actions);
        const running = await this.update();
        if (!running) return;
        this.playerTimer = setTimeout(() => {
            if (!this.started) return;
            const player = this.queue[0];
            this.channel.send(`Time's up! <@${player}> drew a card.`);
            this.drawCards(player, 1);
            this.players.get(player).uno = false;
            this.queue.shift();
            this.queue.push(player);
            this.onNextRound();
        }, this.playerTime * 1000);
    }
    handleSelectMenu(interaction) {
        if (interaction.message.id !== this.selectMenusMessage?.id) return interaction.reply({ content: "This menu has expired.", flags: 'Ephemeral' });
        this.play(interaction, 'selectmenu');
    }
    play(interaction, interactionType) {
        const player = interaction.member.id;
        if (player !== this.queue[0]) return interaction.reply({ content: "It is currently not your turn.", flags: 'Ephemeral' });

        // TODO: check for button / select menu
        if (!interaction.content && !interaction.isChatInputCommand()) return interaction.reply({ content: "Play button/menu is currently work-in-progress. Use `/play card: [card]` instead." });

        let card = (interaction.content?.split(' ').slice(1).join(' ') || interaction.options?.get('card').value).toLowerCase();

        const [cardName, cardAction, cardActionColor] = card.split(' ');
        const playerHand = this.players.get(player).hand;

        if (cardName === 'wild') {
            if (cardAction === '+4') {
                if (!playerHand.includes('wild +4')) return interaction.reply({ content: `You don't have the card: ${this.format('wild +4')}`, flags: 'Ephemeral' });
                if (!colors.includes(cardActionColor)) return interaction.reply({ content: "Please specify a color after Wild +4.", flags: 'Ephemeral' });
                else card = 'wild +4';
            }
            else if (!playerHand.includes('wild')) return interaction.reply({ content: `You don't have the card: ${this.format('wild')}`, flags: 'Ephemeral' });
            else if (!colors.includes(cardAction)) return interaction.reply({ content: "Please specify a color after Wild.", flag: 'Ephemeral' });
            else card = 'wild';
        }
        else if (!Client.CARDS.includes(card)) return interaction.reply({ content: "That card doesn't exist in this game.", flags: 'Ephemeral' });
        else if (!playerHand.includes(card)) return interaction.reply({ content: `You don't have the card: ${this.format(card)}`, flags: 'Ephemeral' });
        else if (colors.includes(cardName)) {
            if (cardName !== this.topCardColor && cardAction !== this.topCard.split(' ')[1]) return interaction.reply({ content: "Your card must either match the color or the action of the top card!", flags: 'Ephemeral' });
        }
        if (this.playerTimer) clearTimeout(this.playerTimer);

        if (this.prevPlayer) {
            const prevPlayerData = this.players.get(this.prevPlayer);
            if (prevPlayerData.hand.length === 1 && !prevPlayerData.uno) {
                this.channel.send(`<@${this.prevPlayer}> forgot to say UNO! and drew a card.`);
                this.drawCards(this.prevPlayer, 1);
            }
        }

        this.topCard = card;
        this.playCard(`${cardName} ${cardAction} ${cardActionColor}`, player);
        interaction.reply({ content: `You played: ${this.format(card)}`, flags: 'Ephemeral' });


        if (!playerHand.length) {
            this.winner = player;
            return this.onEnd();
        }
        this.onNextRound();
    }
    draw(interaction) {
        const player = interaction.member.id;
        if (this.queue[0] !== player) return interaction.reply({ content: "It is currently not your turn.", flags: 'Ephemeral' });

        if (this.playerTimer) clearTimeout(this.playerTimer);
        const card = this.drawCards(player, 1)[0];
        if (!interaction.content) interaction.reply({ content: `You have drawn: ${this.format(card)}`, flags: 'Ephemeral' });
        this.channel.send(`<@${player}> drew a card.`);
        this.players.get(player).uno = false;
        this.queue.shift();
        this.queue.push(player);

        this.onNextRound();
    }
    showHand(interaction) {
        const cards = this.players.get(interaction.member.id).hand.map(card => this.format(card));
        return interaction.reply({ content: `Your current hand: ${cards.join(', ')}`, flags: 'Ephemeral' });
    }
    declareUno(interaction) {
        const playerData = this.players.get(interaction.member.id);
        if (playerData.hand.length === 1 && !playerData.uno) {
            playerData.uno = true;
            this.channel.send(`UNO! <@${interaction.member.id}> has 1 card left.`);
        }
        if (!interaction.content) interaction.deferUpdate();
    }
    playCard(fullCardName) {
        if (!this.started) return;

        const player = this.firstTurn ? '' : this.queue[0];
        const nextPlayer = player ? this.queue[1] : this.queue[0];

        const [cardName, cardAction, cardActionColor] = fullCardName.split(' ');

        // First turn means the card should be put into discard pile from the deck
        const card = `${cardName}` + (cardName === 'wild' && cardAction !== '+4' ? '' : ` ${cardAction}`);
        const index = player ? this.players.get(player).hand.indexOf(card) : this.deck.indexOf(card);
        if (index > -1) player ? this.players.get(player).hand.splice(index, 1) : this.deck.splice(index, 1);
        this.discardPile.push(card);

        // Array.reverse automatically puts the current player in last spot
        if (player && cardAction !== 'reverse') {
            this.queue.shift();
            this.queue.push(player);
            this.prevPlayer = player;
        }

        if (cardName === 'wild') {
            if (colors.includes(cardAction)) this.topCardColor = cardAction;
            else if (cardAction === '+4') {
                this.actions += `<@${nextPlayer}> was forced to draw 4 cards.`;
                this.drawCards(nextPlayer, 4);
                this.queue.shift();
                this.queue.push(nextPlayer);
                this.topCardColor = cardActionColor;
            }
        }
        else if (colors.includes(cardName)) {
            if (cardAction === '+2') {
                this.drawCards(nextPlayer, 2);
                this.actions += `<@${nextPlayer}> was forced to draw 2 cards.`;
                this.queue.shift();
                this.queue.push(nextPlayer);
            }
            else if (cardAction === 'skip') {
                this.actions += `<@${nextPlayer}>'s turn was skipped!`;
                this.queue.shift();
                this.queue.push(nextPlayer);
            }
            else if (cardAction === 'reverse') {
                this.queue.reverse();
                this.actions += "The turn order was reversed.";
            }
            this.topCardColor = cardName;
        }
    }
    drawCards(player, amount) {
        if (!this.started) return;
        const drawnCards = [];
        for (let i = 0; i < amount; i++) {
            const drawnCard = this.deck.random();
            this.deck.splice(this.deck.indexOf(drawnCard), 1);

            if (!this.deck.length) {
                this.discardPile.splice(this.discardPile.indexOf(this.topCard), 1);
                this.deck = [...this.discardPile];
                this.discardPile = [this.topCard];
            }

            drawnCards.push(drawnCard);
        }
        this.players.get(player).hand.push(...drawnCards);
        return drawnCards;
    }
    onLeave(userId) {
        const cards = this.started ? this.players.get(userId).hand : [];
        super.onLeave(userId);
        if (this.started) {
            if (this.players.size < 2) {
                this.winner = this.players.keys().next()?.value;
                return this.onEnd();
            }
            this.discardPile.push(...cards);
            const turn = this.queue[0];
            this.queue.splice(this.queue.indexOf(userId), 1);
            if (userId === turn) {
                clearTimeout(this.playerTimer);
                this.onNextRound();
            }
        }
    }
    async update() {
        if (!this.started) return;
        this.disableButtons();
        this.disableSelectMenus();

        const topCardColor = this.topCardColor;
        const img = new AttachmentBuilder(`./images/${this.id}/colors/${topCardColor}.png`);
        const players = this.queue.map(player => `<@${player}> (${this.players.get(player).hand.length})`).join('\n');
        const embed = new EmbedBuilder()
            .setColor(Tools.toTitleCase(topCardColor))
            .setTitle(this.name)
            .setThumbnail(`attachment://${topCardColor}.png`)
            .addFields({ name: '__Top card__', value: this.format(this.topCard) },
                { name: `__Players (${this.players.size})__`, value: players },
                { name: '__Actions__', value: this.actions },
                {
                    name: '__Information__',
                    value: `- Click the Play button or use the command \`\`/play card: [card]\`\` to play a card.\n
            - Click the Hand button or use the command \`\`/hand\`\` to check your cards.\n
            - Click the Draw button or use the command \`\`/draw\`\` if you don't have a card to play.\n
            - Click the UNO button or use the command \`\`/uno\`\` if you have 1 card left.`
                })
            .setTimestamp()
            .setFooter({
                text: Config.username,
                iconURL: Config.avatarURL
            });

        this.actions = "";
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('play')
                    .setLabel('Play')
                    .setStyle('Primary')
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('hand')
                    .setLabel('Hand')
                    .setStyle('Primary'),
                new ButtonBuilder()
                    .setCustomId('draw')
                    .setLabel('Draw')
                    .setStyle('Primary'),
                new ButtonBuilder()
                    .setCustomId('uno')
                    .setLabel('UNO!')
                    .setStyle('Success')
            );
        this.buttonsMenuMessage = await this.channel.send({ content: `<@${this.queue[0]}>'s turn!`, embeds: [embed], components: [row], files: [img] });
        // Game still running
        if (this.started) return true;
    }
    disableSelectMenus() {
        if (this.selectMenusMessage) {
            const newComponents = [];
            for (const row of this.selectMenusMessage.components) {
                const newRow = ActionRowBuilder.from(row);
                newRow.components[0].setDisabled(true);
                newComponents.push(newRow);
            }
            this.selectMenusMessage.edit({ components: newComponents });
        }
    }
    disableButtons() {
        if (this.buttonsMenuMessage) {
            const row = ActionRowBuilder.from(this.buttonsMenuMessage.components[0]);
            for (const button of row.components) {
                button.setDisabled(true);
            }
            this.buttonsMenuMessage.edit({ components: [row] });
        }
    }
    onEnd() {
        this.disableButtons();
        this.disableSelectMenus();
        super.onEnd();
    }
}

exports.game = UNO;
exports.id = 'uno';