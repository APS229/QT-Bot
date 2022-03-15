'use strict';

const colors = ['blue', 'green', 'red', 'yellow'];

class UNO {
  constructor(channel) {
    this.name = 'UNO';
    this.players = new Map();
    this.roles = new Map();
    this.CARDS = [];
    this.channel = channel;
    const cache = channel.guild.channels.cache;
    this.unoChannels = [cache.find(ch => ch.name === "uno-player1"), cache.find(ch => ch.name === "uno-player2"), cache.find(ch => ch.name === "uno-player3"), cache.find(ch => ch.name === "uno-player4"), cache.find(ch => ch.name === "uno-player5"), cache.find(ch => ch.name === "uno-player6"), ];
    this.started = false;
    this.firstCard = true;
    this.winner = null;
    this.queue = [];
    this.topCard = null;
    if (!this.CARDS.length) {
      this.loadData();
    }
    this.channel.say("**A new game of UNO has been created! Use the command ``.join`` to join the game.**");
  }
  loadData() {
    for (let i = 0; i < colors.length; i++) {
      this.CARDS.push(colors[i] + ' ' + 0);
      for (let j = 0; j < 2; j++) {
        for (let k = 1; k <= 9; k++) {
          this.CARDS.push(colors[i] + ' ' + k);
        }
        this.CARDS.push(colors[i] + ' ' + '+2');
        this.CARDS.push(colors[i] + ' ' + 'skip');
        this.CARDS.push(colors[i] + ' ' + 'reverse');
      }
    }
    for (let i = 0; i < 4; i++) {
      this.CARDS.push('wild');
      this.CARDS.push('wild +4');
    }
  }
  onStart() {
    // if (this.players.size < 2) return this.channel.say("There are not enough players to start the game.");
    this.started = true;
    this.channel.say("**The game of UNO is now starting!**");
    this.assignRoles();
    this.assignCards();
    let card = this.CARDS.random();
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
          const drawnPlayer = this.queue[this.firstCard ? 0 : 1];
          const drawnPlayerCh = this.unoChannels[this.roles.get(drawnPlayer) - 1];
          for (let i = 0; i < 4; i++) {
            const drawnCard = this.CARDS.random();
            this.players.get(drawnPlayer).push(drawnCard);
            drawnCards.push(this.format(drawnCard));
          }
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
              this.players.get(drawnPlayer).push(drawnCard);
              drawnCards.push(this.format(drawnCard));
            }
            this.channel.say(`${drawnPlayer.displayName} was forced to draw 2 cards.`)
            drawnPlayerCh.say(`You were forced to draw: ${drawnCards.join(', ')}`);
            this.queue.shift();
            this.queue.push(drawnPlayer);
          break;
          case 'skip':
            const skippedPlayer = this.queue[this.firstCard ? 0 : 1];
            const skippedPlayerCh = this.unoChannels[this.roles.get(skippedPlayer) - 1];
            this.channel.say(`${skippedPlayer.displayName}'s turn was skipped!`);
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
    this.channel.say(`<@${this.queue[0].user.id}>'s turn.`);
    this.firstCard = false;
  }
  assignRoles() {
    const players = Array.from(this.players.keys());
    let n = 1;
    while (players.length > 0) {
      let player = players.random();
      this.roles.set(player, n);
      players.splice(players.indexOf(player), 1);
      n++;
    }
    let i = 1;
    for (const player of this.roles.keys()) {
      this.queue.push(player);
      const role = this.channel.guild.roles.cache.find(r => r.name === ('UNO Player ' + i));
      this.channel.guild.members.cache.find(m => m.user.id === player.id).roles.add(role);
      i++
    }
  }
  assignCards() {
    for (const player of this.players.keys()) {
      const cards = [];
      for (let i = 0; i < 5; i++) {
        cards.push(this.CARDS.random());
      }
      this.players.set(player, cards);
    }
    for (const player of this.roles.keys()) {
      const channel = this.channel.guild.channels.cache.find(ch => ch.name === 'uno-player' + this.roles.get(player));
      channel.say(`<@${player.user.id}> Your cards are: `);
      const cards = [];
      this.players.get(player).forEach(c => cards.push(this.format(c)));
      channel.say(cards.join(', '));
    }
  }
  showPlayers() {
    const players = [];
    for (const player of this.players.keys()) {
      players.push(player.displayName);
    }
    this.channel.say(`**Players:** ${players.join(', ')}.`);
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
      playerNames.push(player.displayName);
    }
    this.channel.say(`Turn order: ${playerNames.join(', ')}`);
    this.channel.say(`Top Card: **${this.format(this.topCard)}**`)
  }
  draw(player) {
    const currentPlayer = this.queue[0];
    const channel = this.unoChannels[this.roles.get(player) - 1];
    if (currentPlayer !== player) return channel.say("It is currently not your turn!");
    const card = this.CARDS.random();
    this.players.get(player).push(card);
    this.queue.shift();
    this.queue.push(currentPlayer);
    channel.say(`You have drawn: ${this.format(card)}`);
    this.showTurnOrder();
    this.channel.say(`${player.displayName} has drawn a card.`);
    this.channel.say(`<@${this.queue[0].user.id}>'s turn.`);
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
    if (!this.CARDS.includes(card) || !this.players.get(player).includes(card)) {
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
          const drawnCards = [];
          const drawnPlayer = this.queue[this.firstCard ? 0 : 1];
          const drawnPlayerCh = this.unoChannels[this.roles.get(drawnPlayer) - 1];
          for (let i = 0; i < 4; i++) {
            const drawnCard = this.CARDS.random();
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
        else {
          if (channel) return channel.say("You must specify a valid card value.");
        }
      break;
      case 'red':
      case 'yellow':
      case 'blue':
      case 'green':
        if (topCardName !== cardName && topCardValue !== cardValue && !!channel) return channel.say("The card must match a color or a value with the top card.");
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
              this.players.get(drawnPlayer).push(drawnCard);
              drawnCards.push(this.format(drawnCard));
            }
            this.channel.say(`${drawnPlayer.displayName} was forced to draw 2 cards.`)
            drawnPlayerCh.say(`You were forced to draw: ${drawnCards.join(', ')}`);
            this.queue.shift();
            this.queue.push(currentPlayer);
            this.queue.shift();
            this.queue.push(drawnPlayer);
          break;
          case 'skip':
            const skippedPlayer = this.queue[this.firstCard ? 0 : 1];
            const skippedPlayerCh = this.unoChannels[this.roles.get(skippedPlayer) - 1];
            this.channel.say(`${skippedPlayer.displayName}'s turn was skipped!`);
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
        this.topCard = card;
        if (!!player) this.players.get(player).splice(this.players.get(player).indexOf(card), 1);
      break;
    }
    channel.say(`You have played: ${this.format(card)}`);
    this.showTurnOrder();
    this.channel.say(`${player.displayName} has played ${this.format(card)}.`);
    if (!this.players.get(player).length) {
      this.winner = player;
      return this.onEnd();
    }
    this.channel.say(`<@${this.queue[0].user.id}>'s turn.`);
  }
  showHand(player) {
    const channel = this.unoChannels[this.roles.get(player) - 1];
    const cards = [];
    this.players.get(player).forEach(c => cards.push(this.format(c)));
    channel.say(`Your current hand: ${cards.join(', ')}.`);
  }
  onEnd() {
    this.channel.say("**The game of UNO has been ended.**");
    if (this.started) {
      for (const player of this.players.keys()) {
        player.roles.remove(player.roles.cache.find(r => r.name.startsWith('UNO Player')));
      }
    }
    if (this.winner) this.channel.say(`**Congratulations to <@${this.winner.id}> for winning the UNO game!**`);
    delete this.channel.game;
  }
}

exports.game = UNO;
exports.id = 'uno';
