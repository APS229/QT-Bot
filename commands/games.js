'use strict';

const { MessageEmbed } = Client.discord;
const fs = require('fs');

const commands = {
    creategame: {
        options: [
            {
                type: 'STRING',
                name: 'game',
                description: "The game that you want to create.",
                required: true
            },
            {
                type: 'INTEGER',
                name: 'points',
                description: "Points required to win.",
            }
        ],
        modOnly: true,
        desc: "Starts a new game of the specified game.",
        execute(interaction) {
            if (Client.activeGame) return interaction.reply({ content: `There's already a game of ${Client.activeGame.name} going on in <#${Client.activeGame.channel.id}>.`, ephemeral: true });
            const target = Tools.toId(interaction.options._hoistedOptions[0].value);
            const points = interaction.options._hoistedOptions[1]?.value;
            if (!Client.games.has(target)) return interaction.reply({ content: `${target} is not a valid game.\nAvailable games: ${[...Client.games.keys()].join(', ')}`, ephemeral: true });
            if (points > 15 || points < 5) return interaction.reply({ content: "Points must be between 5 - 15.", ephemeral: true });
            const game = Client.games.get(target);
            Client.activeGame = new game(interaction, points);
            interaction.reply({ content: `Successfully created a new game of ${Client.activeGame.name}!`, ephemeral: true });
        }
    },
    joingame: {
        button: true,
        desc: "Joins the current game.",
        execute(interaction) {
            if (!Client.activeGame) return interaction.reply({ content: "There is no game going on right now.", ephemeral: true });
            if (Client.activeGame.freejoin) return interaction.reply({ content: "This game is free to play, you don't have to join.", ephemeral: true });
            if (Client.activeGame.started) return interaction.reply({ content: "The game has already been started.", ephemeral: true });
            if (Client.activeGame.players.has(interaction.user.id)) return interaction.reply({ content: "You have already joined this game!", ephemeral: true });
            if (Client.activeGame.players.size === Client.activeGame.maxPlayers) return interaction.reply({ content: "Max amount of players have been reached for this game.", ephemeral: true });
            Client.activeGame.onJoin(interaction.user.id);
            interaction.reply({ content: `You have successfully joined the game of ${Client.activeGame.name}!`, ephemeral: true });
        }
    },
    leavegame: {
        button: true,
        desc: "Leaves the current game.",
        execute(interaction) {
            if (!Client.activeGame) return interaction.reply({ content: "There is no game going on right now.", ephemeral: true });
            if (!Client.activeGame.players.has(interaction.user.id)) return interaction.reply({ content: "You are not in the current game.", ephemeral: true });
            if (Client.activeGame.started) interaction.reply(`<@${interaction.user.id}> gave up!`);
            else interaction.reply({ content: `You have successfully left the game of ${Client.activeGame.name}!`, ephemeral: true });
            Client.activeGame.onLeave(interaction.user.id);
        }
    },
    disqualify: {
        options: [
            {
                type: 'USER',
                name: 'user',
                description: "User you want to disqualify.",
                required: true
            }
        ],
        modOnly: true,
        desc: "Disqualify a player from the current game.",
        execute(interaction) {
            if (!Client.activeGame) return interaction.reply({ content: "There is no game going on right now.", ephemeral: true });
            interaction.reply(`<@${interaction.options._hoistedOptions[0].value}> has been disqualified.`);
            Client.activeGame.onLeave(interaction.options._hoistedOptions[0].value);
        }
    },
    players: {
        modOnly: true,
        desc: "Lists all players in the current game.",
        execute(interaction) {
            if (!Client.activeGame) return interaction.reply({ content: "There is no game going on right now.", ephemeral: true });
            let players = "";
            for (const player of Client.activeGame.players.entries()) {
                players += `<@${player[0]}>\n`;
            }
            if (!players) players = "None";
            const embed = new MessageEmbed()
                .setTitle(`Players (${Client.activeGame.players.size})`)
                .setDescription(players)
                .setTimestamp()
                .setFooter({ text: `Requested by ${interaction.member.displayName}`, iconURL: interaction.member.avatarURL() ? interaction.member.avatarURL() : interaction.user.avatarURL() })
            interaction.reply({ embeds: [embed] });
        }
    },
    startgame: {
        modOnly: true,
        desc: "Starts the current game.",
        execute(interaction) {
            if (!Client.activeGame) return interaction.reply({ content: "There is no game going on right now.", ephemeral: true });
            if (Client.activeGame.started) return interaction.reply({ content: "The game has already been started.", ephemeral: true });
            if (Client.activeGame.players.size < Client.activeGame.requiredPlayers) return interaction.reply({ content: `The game needs at least ${Client.activeGame.requiredPlayers} players to start!`, ephemeral: true });
            interaction.reply(`<@${interaction.user.id}> has started the game of ${Client.activeGame.name}.`);
            Client.activeGame.onStart();
        }
    },
    endgame: {
        modOnly: true,
        desc: "Ends the current game..",
        execute(interaction) {
            if (!Client.activeGame) return interaction.reply({ content: "There is no game going on right now.", ephemeral: true });
            interaction.reply(`The game of ${Client.activeGame.name} was forcibly ended.`);
            Client.activeGame.onEnd();
        }
    },
    alias: {
        options: [
            {
                type: 'STRING',
                name: 'alias',
                description: "Alias for the game of Empires. (max length 10)",
                required: true
            }
        ],
        desc: "Use an alias in the game of Empires.",
        execute(interaction) {
            if (Client.activeGame?.id !== 'empires') return interaction.reply({ content: "No game of Empires is going on right now.", ephemeral: true });
            if (!Client.activeGame.started) return interaction.reply({ content: "The game must start before choosing aliases.", ephemeral: true });
            if (!Client.activeGame.players.has(interaction.user.id)) return interaction.reply({ content: "You are not in the current game of Empires.", ephemeral: true });
            if (Client.activeGame.setAliases) return interaction.reply({ content: "You cannot change your alias now.", ephemeral: true });
            const alias = Tools.toId(interaction.options._hoistedOptions[0].value);
            if ([...Client.activeGame.aliases.values()].includes(alias)) return interaction.reply({ content: "Somebody else has already picked that alias, please choose another.", ephemeral: true });
            if (alias.length > 16 || alias.length < 3) return interaction.reply({ content: "Alias too big or too short.", ephemeral: true });
            Client.activeGame.setAlias(interaction.user.id, alias);
            interaction.reply({ content: `Your alias has been set to: ${alias}`, ephemeral: true });
        }
    },
    guessalias: {
        options: [
            {
                type: 'USER',
                name: 'user',
                description: "Alias to use for the game of Empires. (max length 10)",
                required: true
            },
            {
                type: 'STRING',
                name: 'alias',
                description: "Alias to guess for the game of Empires.",
                required: true
            }
        ],
        desc: "Guess the alias of someone in the game of Empires.",
        execute(interaction) {
            if (Client.activeGame?.id !== 'empires') return interaction.reply({ content: "No game of Empires is going on right now.", ephemeral: true });
            if (!Client.activeGame?.players.has(interaction.user.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}`, ephemeral: true });
            if (!Client.activeGame?.started) return interaction.reply({ content: "The game must start before choosing aliases.", ephemeral: true });
            Client.activeGame.onGuess(interaction);
        }
    },
    choosedoor: {
        options: [
            {
                type: 'STRING',
                name: 'door',
                description: "Door to pick in the game of Trick House.",
                required: true
            }
        ],
        desc: "Choose a door in the game of Trick House.",
        execute(interaction) {
            if (Client.activeGame?.id !== 'trickhouse') return interaction.reply({ content: "No game of Trick House is going on right now.", ephemeral: true });
            if (!Client.activeGame?.players.has(interaction.user.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}.`, ephemeral: true });
            if (!Client.activeGame?.canGuess) return interaction.reply({ content: "Please wait until next round starts.", ephemeral: true });
            Client.activeGame.onGuess(interaction);
        }
    },
    hide: {
        options: [
            {
                type: 'STRING',
                name: 'spot',
                description: "Hiding spot to pick in the game of Hide and Seek.",
                required: true
            }
        ],
        desc: "Choose a hiding spot in the game of Hide and Seek.",
        execute(interaction) {
            if (Client.activeGame?.id !== 'hideandseek') return interaction.reply({ content: "No game of Hide and Seek is going on right now.", ephemeral: true });
            if (!Client.activeGame?.players.has(interaction.user.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}.`, ephemeral: true });
            if (Client.activeGame.seeker === interaction.user.id) return interaction.reply({ content: "You are the seeker, you can't pick a hiding spot.", ephemeral: true });
            if (!Client.activeGame?.canHide) return interaction.reply({ content: "Please wait until next round starts.", ephemeral: true });
            Client.activeGame.onHide(interaction);
        }
    },
    seek: {
        options: [
            {
                type: 'STRING',
                name: 'spot',
                description: "Seeking spot to pick in the game of Hide and Seek.",
                required: true
            }
        ],
        desc: "Choose a Seeking spot in the game of Hide and Seek.",
        execute(interaction) {
            if (Client.activeGame?.id !== 'hideandseek') return interaction.reply({ content: "No game of Hide and Seek is going on right now.", ephemeral: true });
            if (!Client.activeGame?.players.has(interaction.user.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}.`, ephemeral: true });
            if (Client.activeGame?.seeker !== interaction.user.id) return interaction.reply({ content: "You need to go hide behind a spot, you can't pick a seeking spot.", ephemeral: true });
            if (!Client.activeGame?.canSeek) return interaction.reply({ content: "Please wait for the hiders to hide first.", ephemeral: true });
            Client.activeGame.onSeek(interaction);
        }
    },
    bid: {
        options: [
            {
                type: 'INTEGER',
                name: 'number',
                description: "The number you want to bid.",
                required: true
            }
        ],
        desc: "Bid a number in a game.",
        execute(interaction) {
            if (!Client.activeGame) return interaction.reply({ content: "No game is going on right now.", ephemeral: true });
            if (!Client.activeGame.players.has(interaction.user.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}.`, ephemeral: true });
            if (Client.activeGame.id === 'dicedisaster') {
                if (!Client.activeGame.canGuess) return interaction.reply({ content: "Please wait until the next round.", ephemeral: true });
                Client.activeGame.onGuess(interaction);
            }
            else if (Client.activeGame.id === 'monopoly') {
                if (!Client.activeGame.canBid) return interaction.reply({ content: "There is no property you can bid on right now.", ephemeral: true });
                Client.activeGame.onBid(interaction);
            }
            else {
                interaction.reply({ content: "This game does not have anything to bid for.", ephemeral: true });
            }
        }
    },
    buy: {
        desc: "Buy a property in the game of Monopoly.",
        execute(interaction) {
            if (Client.activeGame?.id !== 'monopoly') return interaction.reply({ content: "No game of Monopoly is going on right now.", ephemeral: true });
            if (!Client.activeGame?.players.has(interaction.user.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}.`, ephemeral: true });
            if (interaction.user.id !== Client.activeGame.queue[0]) return interaction.reply({ content: "It is currently not your turn!", ephemeral: true });
            if (!Client.activeGame.canBuy) return interaction.reply({ content: "There is nothing you can buy right now.", ephemeral: true });
            Client.activeGame.onBuy(interaction);
        }
    },
    summary: {
        options: [
            {
                type: 'USER',
                name: 'player',
                description: "Player you want to see details of."
            }
        ],
        desc: "Shows the player details in the game of Monopoly.",
        execute(interaction) {
            if (Client.activeGame?.id !== 'monopoly') return interaction.reply({ content: "No game of Monopoly is going on right now.", ephemeral: true });
            if (!Client.activeGame.started) return interaction.reply({ content: "The game hasn't started yet.", ephemeral: true });
            interaction.reply({ embeds: [Client.activeGame.getSummary(interaction.options._hoistedOptions[0]?.value)], ephemeral: true });
        }
    },
    bail: {
        desc: "Bail out of Jail in the game of Monopoly",
        async execute(interaction) {
            if (Client.activeGame?.id !== 'monopoly') return interaction.reply({ content: "No game of Monopoly is going on right now.", ephemeral: true });
            if (!Client.activeGame?.players.has(interaction.user.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}.`, ephemeral: true });
            if (interaction.user.id !== Client.activeGame.queue[0]) return interaction.reply({ content: "It is currently not your turn!", ephemeral: true });
            if (!Client.activeGame.players.get(interaction.user.id).inJail) return interaction.reply({ content: "You are not in **Jail** \\⛓️.", ephemeral: true });
            if (!Client.activeGame.canBail) return interaction.reply({ content: "You cannot bail out of **Jail** \\⛓️ right now.", ephemeral: true });
            await interaction.reply(`<@${interaction.user.id}> bailed out of **Jail**!`);
            Client.activeGame.onResolveJail('bail');
        }
    },
    rolldice: {
        desc: "Bail out of Jail in the game of Monopoly",
        async execute(interaction) {
            if (Client.activeGame?.id !== 'monopoly') return interaction.reply({ content: "No game of Monopoly is going on right now.", ephemeral: true });
            if (!Client.activeGame?.players.has(interaction.user.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}.`, ephemeral: true });
            if (interaction.user.id !== Client.activeGame.queue[0]) return interaction.reply({ content: "It is currently not your turn!", ephemeral: true });
            if (!Client.activeGame.players.get(interaction.user.id).inJail) return interaction.reply({ content: "You are not in **Jail** \\⛓️.", ephemeral: true });
            if (!Client.activeGame.canBail) return interaction.reply({ content: "You cannot rolldice to try and get out of **Jail** \\⛓️ right now.", ephemeral: true });
            await interaction.reply(`<@${interaction.user.id}> decided to roll dice to try and get out of **Jail** \\⛓️!`);
            Client.activeGame.onResolveJail('dice');
        }
    },
    animals: {
        desc: "Shows all animals in database.",
        modOnly: true,
        execute(interaction) {
            const animals = JSON.parse(fs.readFileSync('./database/categories.json')).animals.sort();
            interaction.reply("```" + animals.join(', ') + "```");
        }
    }
};

exports.commands = commands;
