'use strict';

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const fs = require('fs');

const tileTypes = {
    '1': '1️⃣',
    '2': '2️⃣',
    '3': '3️⃣',
    '4': '4️⃣',
    '5': '5️⃣',
    '6': '6️⃣',
    '7': '7️⃣',
    '8': '8️⃣',
    '9': '9️⃣',
    '10': '🔟',
    multiple: '*️⃣',
    filler: '⬛',
}

class Monopoly extends Games.Game {
    constructor(interaction) {
        super(interaction);
        this.name = "Monopoly";
        this.description = `- Each round turn by turn, players will roll two dices and the sum of those dices will be the steps the player will move forward to.\n
        - If a player lands on a property, they will have a prompt to buy it, if they don't decide to buy it then an auction will start for the property.\n
        - If a player lands on an action, there's multiple things that can happen.\n
        - Landing on Bank will give you ⏣ 100, landing on Hotel will make you lose ⏣ upto 700.\n
        - If you land on someone's property you'll pay rent equal to the price of the property.\n
        - If they have multiple properties of same type (emoji) then the rent will also be multiplied.\n
        - If you don't have enough money to pay rent, you will be eliminated and the property owner will get all your properties and money.\n
        - Board: 4 emojis represent a single tile, top left emoji will be replaced by players' position landing on it, bottom right emoji will be replaced by player's position that own the property.\n
        - The goal is to either reach ⏣ 4000 or be the last player to not be eliminated.\n
        - Commands are \`/buy\`, \`/bid\`, \`/bail\`, \`/rolldice\` and \`/summary\` to view details such as properties and money of players.`;
        this.queue = [];
        this.board = [];
        this.playerBoard = [];
        this.maxPlayers = 10;
        this.queue = [];
        for (let i = 0; i < 20; i++) {
            this.board[i] = [];
            this.playerBoard[i] = [];
            for (let j = 0; j < 20; j++) {
                this.playerBoard[i][j] = [];
            }
        }
        this.data = {};
        this.canBuy = false;
        this.canBid = false;
        this.canBail = false;
        this.passedStart = false;
        this.playerEliminated = false;
        this.playerTimer = null;
        this.cooldownTimer = null;
        this.roundTimer = null;
        this.resolveTurn = null;
        this.auctionedProperty = null;
        this.playerTime = 25;
        this.cooldownTime = 5;
        this.roundTime = 10;
        this.takenTurns = 0;
        this.round = 0;
        this.rumblePrize = 200;
        this.passStartMoney = 200;
        this.jailBailFee = 100;
        this.actions = [];
        this.bid = { userid: '', number: 0 };
        this.init();
    }
    async loadData() {
        this.data = JSON.parse(fs.readFileSync('./database/monopoly-default.json'));
        this.getLocation(36, [0, 0], true);
        this.actions = [
            async () => {
                const steps = parseInt(Math.random() * 3) + 1, playerDetails = this.players.get(this.queue[0]);
                const position = this.getLocation(-steps, playerDetails.position), property = this.board[position[0]][position[1]];
                playerDetails.position = position;
                this.players.set(this.queue[0], playerDetails);
                await this.channel.send(`A banana appeared and slipped on <@${this.queue[0]}>! They went back **${steps}** step(s) and landed on **${property}** \\${this.data[property].emoji}!`);
                return property;
            },
            async (resolve) => {
                let text = `Santa Claus arrived at <@${this.queue[0]}>'s house, `;
                const playerDetails = this.players.get(this.queue[0]);
                if (parseInt(Math.random() * 4)) {
                    const amount = (parseInt(Math.random() * 5) + 1) * 100;
                    playerDetails.balance += amount;
                    this.players.set(this.queue[0], playerDetails);
                    text += `and gave them **⏣ ${amount}**!`;
                }
                else text += 'said ho ho ho and left.';
                await this.channel.send(text);
                if (playerDetails.balance >= 4000) {
                    this.channel.send(`<@${this.queue[0]}> has reached the ⏣ limit!`);
                    this.winner = this.queue[0];
                    return this.onEnd();
                }
                resolve();
            },
            async (resolve) => {
                await this.channel.send(`They win the Rumble Royale's classic rumble game and earn **⏣ ${this.rumblePrize}**!`);
                const playerDetails = this.players.get(this.queue[0]);
                playerDetails.balance += this.rumblePrize;
                this.players.set(this.queue[0], playerDetails);
                if (playerDetails.balance >= 4000) {
                    this.channel.send(`<@${this.queue[0]}> has reached the ⏣ limit!`);
                    this.winner = this.queue[0];
                    return this.onEnd();
                }
                resolve();
            },
            async (resolve) => {
                const amount = (parseInt(Math.random() * 5) + 1) * 100;
                const playerDetails = this.players.get(this.queue[0]);
                if (playerDetails.balance < amount) {
                    await this.channel.send("They were feeling generous but they do not have enough money to give away!");
                }
                else {
                    const players = [...this.players.keys()];
                    players.splice(players.indexOf(this.queue[0]), 1);
                    const target = players.random(), targetDetails = this.players.get(target);
                    playerDetails.balance -= amount;
                    targetDetails.balance += amount;
                    this.players.set(target, targetDetails);
                    this.players.set(this.queue[0], playerDetails);
                    await this.channel.send(`They were feeling generous and donate **⏣ ${amount}** to <@${target}>!`);
                    if (targetDetails.balance >= 4000) {
                        this.channel.send(`<@${target}> has reached the ⏣ limit!`);
                        this.winner = target;
                        return this.onEnd();
                    }
                }
                resolve();
            },
            async () => {
                const mountains = Object.keys(this.data).filter(loc => this.data[loc].emoji === '⛰️');
                const playerDetails = this.players.get(this.queue[0]);
                const locationPosition = this.getLocation(0, [0, 0], false, playerDetails.position);
                const closestMountain = { name: mountains[0], position: this.data[mountains[0]].position };
                for (let i = 1; i < mountains.length; i++) {
                    if (Math.abs(this.data[mountains[i]].position - locationPosition) < Math.abs(closestMountain.position - locationPosition)) {
                        closestMountain.position = this.data[mountains[i]].position;
                        closestMountain.name = mountains[i];
                    }
                }
                playerDetails.position = this.getLocation(closestMountain.position - locationPosition, playerDetails.position);
                this.players.set(this.queue[0], playerDetails);
                this.channel.send(`They decided to go hiking at the nearest mountain **${closestMountain.name}** \\⛰️!`);
                return closestMountain.name;
            },
            async () => {
                const playerDetails = this.players.get(this.queue[0]);
                const position = this.getLocation(parseInt(Math.random() * 36), [0, 0]);
                const location = this.board[position[0]][position[1]];
                playerDetails.position = position;
                this.players.set(this.queue[0], playerDetails);
                await this.channel.send(`A psychic appeared and teleported them to **${location}** \\${this.data[location].emoji}!`);
                return location;
            },
            async () => {
                const playerDetails = this.players.get(this.queue[0]);
                const start = Object.keys(this.data).find(prop => this.data[prop].position === 0);
                playerDetails.position = [0, 0];
                playerDetails.balance += this.passStartMoney;
                this.players.set(this.queue[0], playerDetails);
                await this.channel.send(`They hop on the flying taxi and advance to **${start}**!`);
                this.channel.send(`They also passed **${start}** and gained **⏣ ${this.passStartMoney}**.`);
                if (playerDetails.balance >= 4000) {
                    this.channel.send(`<@${this.queue[0]}> has reached the ⏣ limit!`);
                    this.winner = this.queue[0];
                    return this.onEnd();
                }
                return start;
            },
            async (resolve, doubles) => {
                const playerDetails = this.players.get(this.queue[0]);
                const position = this.getLocation(this.data['Jail'].position, [0, 0]);
                playerDetails.position = position;
                playerDetails.inJail = true;
                playerDetails.jailTurns = 0;
                this.players.set(this.queue[0], playerDetails);
                if (doubles) {
                    const thisPlayer = this.queue[0];
                    this.queue.shift();
                    this.queue.push(thisPlayer);
                    this.takenTurns++;
                }
                await this.channel.send("They were caught trying to hack SPA to rig Monopoly and were sent to **Jail** \\⛓️!");
                resolve();
            },
            async (resolve) => {
                const playerDetails = this.players.get(this.queue[0]);
                playerDetails.jailCard = true;
                this.players.set(this.queue[0], playerDetails);
                await this.channel.send("They withdrew a **Jail Card**!");
                resolve();
            }
        ];
    }
    getLocation(steps, position, loadData, toPosition) {
        if (steps === 0 && !toPosition) return position;
        let [i, j] = position;
        if (steps > 0 || toPosition) {
            let reverse = i > j ? true : false, pos = 0;
            while (true) {
                if (loadData) this.board[i][j] = (pos + 3) % 9 === 0 || (pos - 3) % 9 === 0 ? 'Action' : Object.keys(this.data).find(l => this.data[l].position === pos);
                if (j === 18) {
                    if (i === 18) {
                        reverse = true;
                        j -= 2;
                    }
                    else i += 2;
                }
                else {
                    if (reverse) {
                        if (j === 0) {
                            if (i === 0) {
                                reverse = false;
                                j += 2;
                            }
                            else {
                                i -= 2;
                            }
                        }
                        else j -= 2;
                    }
                    else j += 2;
                }
                if (i === 0 && j === 0 && !loadData) this.passedStart = true;
                steps--;
                if (loadData) pos++;
                if (steps === 0 && !toPosition) return [i, j];
                else if (toPosition && toPosition[0] === i && toPosition[1] === j) return -steps;
            }
        }
        else {
            let reverse = j > i ? true : false;
            while (true) {
                if (i === 18) {
                    if (j === 18) {
                        reverse = true;
                        i -= 2;
                    }
                    else j += 2;
                }
                else {
                    if (reverse) {
                        if (i === 0) {
                            if (j === 0) {
                                reverse = false;
                                i += 2;
                            }
                            else {
                                j -= 2;
                            }
                        }
                        else i -= 2;
                    }
                    else i += 2;
                }
                steps++;
                if (steps === 0) return [i, j];
            }
        }
    }
    onStart() {
        const randomized = [...this.players.entries()].shuffle();
        for (let i = 0; i < randomized.length; i++) {
            randomized[i][1] = {
                balance: 1500,
                properties: [],
                position: [0, 0],
                order: (i + 1).toString()
            };
            this.queue.push(randomized[i][0]);
            this.playerBoard[0][0].push((i + 1).toString());
        }
        this.players = new Map(randomized);
        super.onStart();
        this.onNextRound();
    }
    getSummary(userid) {
        const embed = new EmbedBuilder()
            .setTitle("Summary for Monopoly")
            .setTimestamp();
        if (this.players.has(userid)) {
            const playerDetails = this.players.get(userid);
            embed.addFields({ name: `${playerDetails.order}`, value: `**Player:** <@${userid}>\n**Balance:** ${playerDetails.balance}\n**Properties:** ${playerDetails.properties.length ? Tools.joinList(playerDetails.properties.map(p => p + ' \\' + this.data[p].emoji)) : "None"}` });
            return embed;
        }
        for (const player of this.players) {
            embed.addFields({ name: `${player[1].order}`, value: `**Player:** <@${player[0]}>\n**Balance:** ${player[1].balance}\n**Properties:** ${player[1].properties.length ? Tools.joinList(player[1].properties.map(p => p + ' \\' + this.data[p].emoji)) : "None"}` });
        }
        return embed;
    }
    async onNextRound() {
        this.takenTurns = 0;
        this.round++;
        await this.update();
        this.cooldownTimer = setTimeout(() => this.onNextTurn(), this.cooldownTime * 1000);
    }
    async onNextTurn() {
        if (this.toBeEliminated) {
            this.queue.splice(this.queue.indexOf(this.toBeEliminated), 1);
            this.takenTurns--;
            this.toBeEliminated = null;
        }
        await this.updateBoard();
        let text = '';
        const playerDetails = this.players.get(this.queue[0]);
        let dice1 = 0, dice2 = 0;
        if (playerDetails.inJail) {
            playerDetails.jailTurns++;
            if (playerDetails.jailTurns === 4) {
                await this.channel.send(`Since it is <@${this.queue[0]}>'s 4th turn in **Jail** \\⛓️, they must use ${playerDetails.jailCard ? 'their **Jail card** '
                    : '**⏣ ' + this.jailBailFee + '**'} to bail out from **Jail** \\⛓️!`);
                if (playerDetails.balance < this.jailBailFee) {
                    await this.channel.send(`They don't have enough ⏣ to bail out and have been eliminated!`);
                    this.onLeave(this.queue[0]);
                    return this.cooldownTimer = setTimeout(() => {
                        if (this.ended) return;
                        this.takenTurns < this.queue.length ? this.onNextTurn() : this.onNextRound();
                    }, this.cooldownTime * 1000);
                }
                else {
                    playerDetails.jailCard ? playerDetails.jailCard = false : playerDetails.balance -= this.jailBailFee;
                    playerDetails.inJail = false;
                    playerDetails.jailTurns = 0;
                    this.players.set(this.queue[0], playerDetails);
                }
                await new Promise(resolve => {
                    if (this.ended) return;
                    this.cooldownTimer = setTimeout(resolve, this.cooldownTime * 1000);
                });
                await this.updateBoard();
            }
            else {
                let text = `It is <@${this.queue[0]}>'s ${Tools.toNumberOrderString(playerDetails.jailTurns)} turn in **Jail** \\⛓️.\n`;
                if (playerDetails.balance < this.jailBailFee) {
                    dice1 = parseInt((Math.random() * 6) + 1);
                    dice2 = parseInt((Math.random() * 6) + 1);
                    text += "They don't have enough money to bail out and must roll dice to try and get out.";
                }
                else {
                    text += `They can either try to roll doubles (\`/rolldice\`) or use their ${playerDetails.jailCard ? '**Jail card**' : '**⏣ ' + this.jailBailFee + '**'} (\`/bail\`) to bail out.`;
                }
                await this.channel.send(text);
                if (dice1 && dice2) {
                    if (dice1 !== dice2) {
                        this.channel.send(`They rolled **[${dice1}] [${dice2}]** and failed to get out of **Jail** \\⛓️!`);
                        return this.cooldownTimer = setTimeout(() => {
                            if (this.ended) return;
                            const thisPlayer = this.queue[0];
                            this.queue.shift();
                            this.queue.push(thisPlayer);
                            this.takenTurns++;
                            this.takenTurns < this.queue.length ? this.onNextTurn() : this.onNextRound();
                        }, this.cooldownTime * 1000);
                    }
                    playerDetails.inJail = false;
                    playerDetails.jailTurns = 0;
                    this.players.get(this.queue[0], playerDetails);
                    text = ' to get out of **Jail** \\⛓️';
                    await this.updateBoard();
                }
                else {
                    this.promise = new Promise((resolve, reject) => {
                        this.resolveJail = resolve;
                        this.canBail = true;
                        this.playerTimer = setTimeout(async () => {
                            if (this.ended) return;
                            dice1 = parseInt((Math.random() * 6) + 1);
                            dice2 = parseInt((Math.random() * 6) + 1);
                            if (dice1 !== dice2) {
                                this.channel.send(`They rolled **[${dice1}] [${dice2}]** and failed to get out of **Jail** \\⛓️!`);
                                reject();
                                this.promise = null;
                            }
                            else {
                                playerDetails.inJail = false;
                                playerDetails.jailTurns = 0;
                                this.players.get(this.queue[0], playerDetails);
                                text = ' to get out of **Jail** \\⛓️';
                                await this.updateBoard();
                                resolve();
                            }
                        }, this.playerTime * 1000);
                    });
                }
            }
        }
        try {
            const method = await this.promise;
            if (method) {
                this.promise = null;
                if (method === 'bail') {
                    playerDetails.jailCard ? playerDetails.jailCard = false : playerDetails.balance -= this.jailBailFee;
                    playerDetails.inJail = false;
                    playerDetails.jailTurns = 0;
                    this.players.set(this.queue[0], playerDetails);
                }
                else if (method === 'dice') {
                    dice1 = parseInt((Math.random() * 6) + 1);
                    dice2 = parseInt((Math.random() * 6) + 1);
                    if (dice1 !== dice2) {
                        await this.channel.send(`They rolled **[${dice1}] [${dice2}]** and failed to get out of **Jail** \\⛓️!`);
                        const thisPlayer = this.queue[0];
                        this.queue.shift();
                        this.queue.push(thisPlayer);
                        this.takenTurns++;
                        return this.cooldownTimer = setTimeout(() => {
                            if (this.ended) return;
                            this.takenTurns < this.queue.length ? this.onNextTurn() : this.onNextRound();
                        }, this.cooldownTime * 1000);
                    }
                    else {
                        playerDetails.inJail = false;
                        playerDetails.jailTurns = 0;
                        this.players.set(this.queue[0], playerDetails);
                        text = ' to get out of **Jail** \\⛓️';
                    }
                }
                await new Promise(resolve => {
                    if (this.ended) return;
                    this.cooldownTimer = setTimeout(resolve, this.cooldownTime * 1000);
                });
                await this.updateBoard();
            }
        }
        catch (err) {
            return this.cooldownTimer = setTimeout(() => {
                if (this.ended) return;
                const thisPlayer = this.queue[0];
                this.queue.shift();
                this.queue.push(thisPlayer);
                this.takenTurns++;
                this.takenTurns < this.queue.length ? this.onNextTurn() : this.onNextRound();
            }, this.cooldownTime * 1000);
        }
        if (!dice1) dice1 = parseInt((Math.random() * 6) + 1);
        if (!dice2) dice2 = parseInt((Math.random() * 6) + 1);
        const position = this.getLocation(dice1 + dice2, playerDetails.position);
        playerDetails.position = position;
        this.players.set(this.queue[0], playerDetails);
        const property = this.board[position[0]][position[1]];
        await this.channel.send(`<@${this.queue[0]}> rolled **[${dice1}] [${dice2}]**${text} and landed on **${property}** \\${this.data[property].emoji}.`);
        const promise = new Promise(resolve => {
            this.resolveTurn = resolve;
            this.handleTurn(property, dice1 === dice2, resolve);
        });
        promise.then(() => {
            this.cooldownTimer = setTimeout(() => {
                if (this.ended) return;
                if (this.playerEliminated || dice1 !== dice2) {
                    const thisPlayer = this.queue[0];
                    this.queue.shift();
                    this.queue.push(thisPlayer);
                    this.takenTurns++;
                }
                this.playerEliminated = false;
                this.takenTurns < this.queue.length ? this.onNextTurn() : this.onNextRound();
            }, this.cooldownTime * 1000);
        });
    }
    async handleTurn(property, doubles, resolve) {
        const playerDetails = this.players.get(this.queue[0]);
        if (this.passedStart) {
            playerDetails.balance += this.passStartMoney;
            this.players.set(this.queue[0], playerDetails);
            this.channel.send(`They also passed **Start** and gained **⏣ ${this.passStartMoney}**.`);
            if (playerDetails.balance >= 4000) {
                this.channel.send(`<@${this.queue[0]}> has reached the ⏣ limit!`);
                this.winner = this.queue[0];
                return this.onEnd();
            }
            this.passedStart = false;
        }
        const propertyOwner = [...this.players].find(player => this.players.get(player[0]).properties.includes(property));
        if (propertyOwner && propertyOwner[0] === this.queue[0]) resolve();
        else if (propertyOwner) {
            const rent = propertyOwner[1].properties.filter(prop => this.data[prop].emoji === this.data[property].emoji || this.data[prop].type && this.data[prop].type === this.data[property].type).length * this.data[property].price;
            if (playerDetails.balance < rent) {
                this.channel.send(`They don't have enough ⏣ to pay the rent (**⏣ ${rent}**) and have been eliminated by <@${propertyOwner[0]}>!`);
                this.playerEliminated = true;
                propertyOwner[1].balance += playerDetails.balance;
                if (propertyOwner[1].balance >= 4000) {
                    this.channel.send(`<@${propertyOwner[0]}> has reached the ⏣ limit!`);
                    this.winner = propertyOwner[0];
                    return this.onEnd();
                }
                propertyOwner[1].properties = propertyOwner[1].properties.concat(playerDetails.properties);
                this.players.set(propertyOwner[0], propertyOwner[1]);
                this.onLeave(this.queue[0]);
            }
            else {
                this.channel.send(`<@${this.queue[0]}> paid <@${propertyOwner[0]}> **⏣ ${rent}** as rent!`);
                propertyOwner[1].balance += rent;
                playerDetails.balance -= rent;
                this.players.set(this.queue[0], playerDetails);
                this.players.set(propertyOwner[0], propertyOwner[1]);
                if (propertyOwner[1].balance >= 4000) {
                    this.channel.send(`<@${propertyOwner[0]}> has reached the ⏣ limit!`);
                    this.winner = propertyOwner[0];
                    return this.onEnd();
                }
            }
            resolve();
        }
        else if (this.data[property].price) {
            const price = this.data[property].price, playerDetails = this.players.get(this.queue[0]);
            if (playerDetails.balance < price) {
                this.channel.send(`They don't have enough ⏣ to buy the property so an auction will begin`);
                this.auctionedProperty = property;
                this.startAuction();
            }
            else {
                const message = {
                    content: `Would you like to buy **${property}** \\${this.data[property].emoji} for **⏣ ${price}**? (You currently have: **⏣ ${playerDetails.balance}**)`,
                    components: []
                };
                message.components.push(new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('buy')
                            .setLabel('Buy')
                            .setStyle('Success')
                    )
                );
                this.channel.send(message);
                this.canBuy = true;
                this.playerTimer = setTimeout(() => {
                    if (this.ended) return;
                    this.canBuy = false;
                    this.channel.send(`They decided to not buy **${property}** \\${this.data[property].emoji}.`);
                    this.auctionedProperty = property;
                    this.startAuction(property);
                }, this.playerTime * 1000);
            }
        }
        else {
            if (property === 'Hotel') {
                const rent = parseInt((Math.random() * 7) + 1) * 100;
                if (playerDetails.balance < rent) {
                    this.channel.send(`They don't have enough ⏣ to pay the rent (**⏣ ${rent}**) and have been eliminated!`);
                    this.onLeave(this.queue[0]);
                    this.playerEliminated = true;
                }
                else {
                    this.channel.send(`<@${this.queue[0]}> paid **⏣ ${rent}** as rent!`);
                    playerDetails.balance -= rent;
                    this.players.set(this.queue[0], playerDetails);
                }
                resolve();
            }
            else if (property === 'Bank') {
                const withdrawn = 100;
                this.channel.send(`<@${this.queue[0]}> withdrew **⏣ ${withdrawn}**!`);
                playerDetails.balance += withdrawn;
                this.players.set(this.queue[0], playerDetails);
                if (playerDetails.balance >= 4000) {
                    this.channel.send(`<@${this.queue[0]}> has reached the ⏣ limit!`);
                    this.winner = this.queue[0];
                    return this.onEnd();
                }
                resolve();
            }
            else if (property === 'Action') {
                const newProperty = await this.actions.random()(resolve, doubles);
                if (newProperty) this.handleTurn(newProperty, doubles, resolve);
            }
            else {
                resolve();
            }
        }
    }
    startAuction() {
        this.channel.send(`Place your bids on **${this.auctionedProperty}** \\${this.data[this.auctionedProperty].emoji} (**⏣ ${this.data[this.auctionedProperty].price}**) with \`/bid\` command.`);
        this.canBid = true;
    }
    onBid(interaction) {
        const bid = interaction.options?._hoistedOptions[0].value || interaction.content.split(' ').slice(1)[0];
        if (bid % 5 !== 0 || bid < 5) return interaction.reply({ content: "Your bid must be a multiple of **⏣ 5**.", flags: 'Ephemeral' });
        const playerDetails = this.players.get(interaction.member.id);
        if (bid > playerDetails.balance) return interaction.reply({ content: `You can't bid more than what you have. (**⏣ ${playerDetails.balance}**)`, flags: 'Ephemeral' });
        if (bid <= this.bid.number) return interaction.reply({ content: `Your bid must be higher than current bid (**⏣ ${this.bid.number}**)!`, flags: 'Ephemeral' });
        clearTimeout(this.roundTimer);
        this.bid = { userid: interaction.member.id, number: bid };
        this.roundTimer = setTimeout(() => {
            this.canBid = false;
            playerDetails.properties.push(this.auctionedProperty);
            playerDetails.balance -= bid;
            this.channel.send(`**${this.auctionedProperty}** \\${this.data[this.auctionedProperty].emoji} was sold to <@${interaction.member.id}> for **⏣ ${bid}**!`);
            this.bid = { userid: '', number: 0 };
            this.resolveTurn();
        }, this.roundTime * 1000);
        interaction.reply(`<@${interaction.member.id}> bid **⏣ ${bid}**!`);
    }
    async onBuy(interaction) {
        clearTimeout(this.playerTimer);
        this.canBuy = false;
        const position = this.players.get(interaction.member.id).position;
        const property = this.board[position[0]][position[1]];
        const playerDetails = this.players.get(interaction.member.id);
        playerDetails.balance -= this.data[property].price;
        playerDetails.properties.push(property);
        this.players.set(interaction.member.id, playerDetails);
        await interaction.reply(`<@${interaction.member.id}> bought the property **${property}** \\${this.data[property].emoji} for **⏣ ${this.data[property].price}**!`);
        this.resolveTurn();
    }
    async onResolveJail(method) {
        clearTimeout(this.playerTimer);
        this.canBail = false;
        this.resolveJail(method);
    }
    async update() {
        const players = Tools.joinList([...this.players.entries()].map(p => `<@${p[0]}> (${p[1].order})`));
        const embed = new EmbedBuilder()
            .setTitle(`Monopoly Round ${this.round}`)
            .addFields({ name: "Players", value: players })
            .setTimestamp();
        await this.channel.send({ embeds: [embed] });
    }
    async updateBoard() {
        const conditions = [[0, 0], [-1, 0], [0, -1], [-1, -1]];
        let board = "";
        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 20; j++) {
                let placed = false;
                if (this.board[i - 1] && this.board[i - 1][j - 1]) {
                    const propertyOwnerDetails = [...this.players.values()].find(p => p.properties.includes(this.board[i - 1][j - 1]));
                    if (propertyOwnerDetails) {
                        board += tileTypes[propertyOwnerDetails.order];
                        continue;
                    }
                }
                const players = [...this.players.values()].filter(p => p.position[0] === i && p.position[1] === j);
                if (players.length) {
                    if (players.length > 1) board += tileTypes['multiple'];
                    else board += tileTypes[players[0].order];
                    continue;
                }
                for (const con of conditions) {
                    if (this.board[i + con[0]] && this.board[i + con[0]][j + con[1]]) {
                        board += this.data[this.board[i + con[0]][j + con[1]]]?.emoji;
                        placed = true;
                        break;
                    }
                }
                if (!placed) board += tileTypes['filler'];
            }
            board += '\n';
        }
        this.channel.send('```' + board + '```');
    }
    onLeave(userid) {
        super.onLeave(userid);
        if (this.bid.userid === userid && this.players.size !== 1) {
            clearTimeout(this.roundTimer);
            this.bid.userid = '';
            this.bid.number = 0;
            this.channel.send(`It looks like the highest bidder has left the game. Please place your bids on **${this.auctionedProperty}** \\${this.data[this.auctionedProperty].emoji} (**⏣ ${this.data[this.auctionedProperty].price}**) with \`/bid\` again.`)
        }
        if (this.started) {
            if (this.players.size === 1) {
                this.winner = this.players.keys().next().value;
                return this.onEnd();
            }
            if (this.queue[0] === userid) this.toBeEliminated = userid;
            else this.queue.splice(this.queue.indexOf(userid), 1);
        }
    }
    onEnd() {
        this.ended = true;
        super.onEnd();
    }
}

exports.game = Monopoly;
exports.id = 'monopoly';