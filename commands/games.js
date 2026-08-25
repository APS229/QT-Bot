'use strict';

const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const commands = {
    creategame: {
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: 'game',
                description: "The game that you want to create.",
                required: true
            },
            {
                type: ApplicationCommandOptionType.Integer,
                name: 'points',
                description: "Points required to win.",
            }
        ],
        modOnly: true,
        desc: "Start a new game of the specified game.",
        execute(interaction) {
            if (Client.activeGame) return interaction.reply({ content: `There's already a game of ${Client.activeGame.name} going on in <#${Client.activeGame.channel.id}>.`, flags: 'Ephemeral' });
            const [...args] = interaction.options?._hoistedOptions || interaction.content.split(' ').slice(1);
            const target = Tools.toId(args[0]?.value || args[0]);
            const points = args[1]?.value || args[1];
            if (!Client.games.has(target)) return interaction.reply({ content: `${target} is not a valid game.\nAvailable games: ${[...Client.games.keys()].join(', ')}`, flags: 'Ephemeral' });
            if (points && points > 15 || points < 5) return interaction.reply({ content: "Points must be between 5 - 15.", flags: 'Ephemeral' });
            const game = Client.games.get(target);
            Client.activeGame = new game(interaction, points);
            interaction.reply({ content: `Successfully created a new game of ${Client.activeGame.name}!`, flags: 'Ephemeral' });
        }
    },
    joingame: {
        desc: "Join the current game.",
        execute(interaction) {
            if (!Client.activeGame) return interaction.reply({ content: "There is no game going on right now.", flags: 'Ephemeral' });
            if (Client.activeGame.freejoin) return interaction.reply({ content: "This game is free to play, you don't have to join.", flags: 'Ephemeral' });
            if (Client.activeGame.started) return interaction.reply({ content: "The game has already been started.", flags: 'Ephemeral' });

            if (Client.activeGame.players.has(interaction.member.id)) return interaction.reply({ content: "You have already joined this game!", flags: 'Ephemeral' });
            if (Client.activeGame.players.size === Client.activeGame.maxPlayers) return interaction.reply({ content: "Max amount of players have been reached for this game.", flags: 'Ephemeral' });
            // TODO: make the second argument user tag only
            Client.activeGame.onJoin(interaction.member.id, Client.activeGame.id === 'empires' ? interaction.member.user.tag : 0);
            interaction.reply({ content: `You have successfully joined the game of ${Client.activeGame.name}!`, flags: 'Ephemeral' });
        }
    },
    leavegame: {
        desc: "Leave the current game.",
        execute(interaction) {
            if (!Client.activeGame) return interaction.reply({ content: "There is no game going on right now.", flags: 'Ephemeral' });
            if (Client.activeGame.freejoin) return interaction.reply({ content: "You cannot leave a free-join game.", flags: 'Ephemeral' });
            if (!Client.activeGame.players.has(interaction.member.id)) return interaction.reply({ content: "You are not in the current game.", flags: 'Ephemeral' });
            if (Client.activeGame.started) interaction.reply(`<@${interaction.member.id}> gave up!`);
            else interaction.reply({ content: `You have successfully left the game of ${Client.activeGame.name}!`, flags: 'Ephemeral' });
            Client.activeGame.onLeave(interaction.member.id);
        }
    },
    disqualify: {
        options: [
            {
                type: ApplicationCommandOptionType.User,
                name: 'user',
                description: "User you want to disqualify.",
                required: true
            }
        ],
        modOnly: true,
        desc: "Disqualify a player from the current game.",
        execute(interaction) {
            if (!Client.activeGame) return interaction.reply({ content: "There is no game going on right now.", flags: 'Ephemeral' });
            const userId = interaction.options?._hoistedOptions[0].value || interaction.mentions.users.first()?.id;
            if (!userId || !Client.activeGame.players.has(userId)) return interaction.reply("You must specify a player in the game.");
            interaction.reply(`<@${userId}> has been disqualified.`);
            Client.activeGame.onLeave(userId);
        }
    },
    players: {
        modOnly: true,
        desc: "List all players in the current game.",
        execute(interaction) {
            if (!Client.activeGame) return interaction.reply({ content: "There is no game going on right now.", flags: 'Ephemeral' });
            const players = [...Client.activeGame.players.keys()].map(player => `<@${player}>`).join('\n');
            const embed = new EmbedBuilder()
                .setTitle(`Players (${Client.activeGame.players.size})`)
                .setDescription(players || "None")
                .setTimestamp()
                .setFooter({
                    text: `Requested by ${interaction.member.displayName}`,
                    iconURL: interaction.member.avatarURL() ? interaction.member.avatarURL() : (interaction.user?.avatarURL() || interaction.author.avatarURL())
                });
            interaction.reply({ embeds: [embed] });
        }
    },
    startgame: {
        modOnly: true,
        desc: "Start the current game.",
        execute(interaction) {
            if (!Client.activeGame) return interaction.reply({ content: "There is no game going on right now.", flags: 'Ephemeral' });
            if (Client.activeGame.freejoin) return interaction.reply({ content: "This game is free to play, you don't have to start it.", flags: 'Ephemeral' });
            if (Client.activeGame.started) return interaction.reply({ content: "The game has already been started.", flags: 'Ephemeral' });
            if (Client.activeGame.players.size < Client.activeGame.requiredPlayers) return interaction.reply(
                {
                    content: `The game needs at least ${Client.activeGame.requiredPlayers} players to start!`,
                    flags: 'Ephemeral'
                });
            interaction.reply(`<@${interaction.member.id}> has started the game of ${Client.activeGame.name}.`);
            Client.activeGame.onStart();
        }
    },
    endgame: {
        modOnly: true,
        desc: "End the current game.",
        execute(interaction) {
            if (!Client.activeGame) return interaction.reply({ content: "There is no game going on right now.", flags: 'Ephemeral' });
            interaction.reply(`The game of ${Client.activeGame.name} was forcibly ended.`);
            Client.activeGame.onEnd();
        }
    },
    guess: {
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: 'answer',
                description: "The guess answer.",
                required: true
            }
        ],
        desc: "Guess an answer in the current game.",
        execute(interaction) {
            // TODO: check if current channel is same as game channel for all commands that use .onGuess
            // TODO: convert .onGuess() in puzzle games/russian roulette/hangman to use interaction directly
            if (!Client.activeGame) return interaction.reply({ content: "There is no game going on right now.", flags: 'Ephemeral' });
            if (Client.activeGame.type !== 'puzzle' && Client.activeGame.id !== 'russianroulette') return interaction.reply({ content: "You cannot guess answers in this game.", flags: 'Ephemeral' });
            if (!Client.activeGame.canGuess) return interaction.reply({ content: "Please wait until next round starts.", flags: 'Ephemeral' });
            const guess = Tools.toId(interaction.options?._hoistedOptions[0].value || interaction.content.split(' ')[1]);
            Client.activeGame.onGuess(interaction.member.id, guess);
        }
    },
    alias: {
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: 'alias',
                description: "Alias for the game of Empires. (3 to 15 characters)",
                required: true
            }
        ],
        desc: "Pick an alias in the game of Empires.",
        execute(interaction) {
            if (Client.activeGame?.id !== 'empires') return interaction.reply({ content: "No game of Empires is going on right now.", flags: 'Ephemeral' });
            if (!Client.activeGame.started) return interaction.reply({ content: "The game must start before choosing aliases.", flags: 'Ephemeral' });
            if (!Client.activeGame.players.has(interaction.member.id)) return interaction.reply({ content: "You are not in the current game of Empires.", flags: 'Ephemeral' });
            if (Client.activeGame.setAliases) return interaction.reply({ content: "You cannot change your alias now.", flags: 'Ephemeral' });
            const pickedAlias = interaction.options?._hoistedOptions[0].value;
            if (!pickedAlias) return interaction.reply("Your alias must be anonymous, please use the slash command.");
            const alias = Tools.toId(pickedAlias);
            if ([...Client.activeGame.aliases.values()].includes(alias)) return interaction.reply({ content: "Somebody else has already picked that alias, please choose another.", flags: 'Ephemeral' });
            if (alias.length > 16 || alias.length < 3) return interaction.reply({ content: "Alias must be longer than 2 characters and shorter than 16 characters.", flags: 'Ephemeral' });
            Client.activeGame.setAlias(interaction.member.id, alias);
            interaction.reply({ content: `Your alias has been set to: ${alias}`, flags: 'Ephemeral' });
        }
    },
    guessalias: {
        options: [
            {
                type: ApplicationCommandOptionType.User,
                name: 'user',
                description: "Player to guess the alias of in the game of Empires.",
                required: true
            },
            {
                type: ApplicationCommandOptionType.String,
                name: 'alias',
                description: "Alias to guess for the game of Empires.",
                required: true
            }
        ],
        desc: "Guess the alias of someone in the game of Empires.",
        execute(interaction) {
            if (Client.activeGame?.id !== 'empires') return interaction.reply({ content: "No game of Empires is going on right now.", flags: 'Ephemeral' });
            if (!Client.activeGame?.players.has(interaction.member.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}`, flags: 'Ephemeral' });
            if (!Client.activeGame?.started) return interaction.reply({ content: "The game must start before guessing aliases.", flags: 'Ephemeral' });
            Client.activeGame.onGuess(interaction);
        }
    },
    choosedoor: {
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: 'door',
                description: "Door to pick in the game of Trick House.",
                required: true
            }
        ],
        desc: "Choose a door in the game of Trick House.",
        execute(interaction) {
            if (Client.activeGame?.id !== 'trickhouse') return interaction.reply({ content: "No game of Trick House is going on right now.", flags: 'Ephemeral' });
            if (!Client.activeGame.players.has(interaction.member.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}.`, flags: 'Ephemeral' });
            if (!Client.activeGame.canGuess) return interaction.reply({ content: "Please wait until next round starts.", flags: 'Ephemeral' });
            Client.activeGame.onGuess(interaction);
        }
    },
    hide: {
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: 'spot',
                description: "Hiding spot to pick in the game of Hide and Seek.",
                required: true
            }
        ],
        desc: "Choose a hiding spot in the game of Hide and Seek.",
        execute(interaction) {
            if (Client.activeGame?.id !== 'hideandseek') return interaction.reply({ content: "No game of Hide and Seek is going on right now.", flags: 'Ephemeral' });
            if (!Client.activeGame.players.has(interaction.member.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}.`, flags: 'Ephemeral' });
            if (Client.activeGame.seeker === interaction.member.id) return interaction.reply({ content: "You are the seeker, you can't pick a hiding spot.", flags: 'Ephemeral' });
            if (!Client.activeGame.canHide) return interaction.reply({ content: "Please wait until next round starts.", flags: 'Ephemeral' });
            Client.activeGame.onHide(interaction);
        }
    },
    seek: {
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: 'spot',
                description: "Seeking spot to pick in the game of Hide and Seek.",
                required: true
            }
        ],
        desc: "Choose a Seeking spot in the game of Hide and Seek.",
        execute(interaction) {
            if (Client.activeGame?.id !== 'hideandseek') return interaction.reply({ content: "No game of Hide and Seek is going on right now.", flags: 'Ephemeral' });
            if (!Client.activeGame?.players.has(interaction.member.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}.`, flags: 'Ephemeral' });
            if (Client.activeGame?.seeker !== interaction.member.id) return interaction.reply({ content: "You need to go hide behind a spot, you can't pick a seeking spot.", flags: 'Ephemeral' });
            if (!Client.activeGame?.canSeek) return interaction.reply({ content: "Please wait for the hiders to hide first.", flags: 'Ephemeral' });
            Client.activeGame.onSeek(interaction);
        }
    },
    bid: {
        options: [
            {
                type: ApplicationCommandOptionType.Integer,
                name: 'number',
                description: "The number you want to bid.",
                required: true
            }
        ],
        desc: "Bid a number in a game.",
        execute(interaction) {
            if (!Client.activeGame) return interaction.reply({ content: "No game is going on right now.", flags: 'Ephemeral' });
            if (!Client.activeGame.players.has(interaction.member.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}.`, flags: 'Ephemeral' });
            if (Client.activeGame.id === 'dicedisaster') {
                if (!Client.activeGame.canGuess) return interaction.reply({ content: "Please wait until the next round.", flags: 'Ephemeral' });
                Client.activeGame.onGuess(interaction);
            }
            else if (Client.activeGame.id === 'monopoly') {
                if (!Client.activeGame.canBid) return interaction.reply({ content: "There is no property you can bid on right now.", flags: 'Ephemeral' });
                Client.activeGame.onBid(interaction);
            }
            else {
                interaction.reply({ content: "This game does not have anything to bid for.", flags: 'Ephemeral' });
            }
        }
    },
    buy: {
        desc: "Buy a property in the game of Monopoly.",
        execute(interaction) {
            if (Client.activeGame?.id !== 'monopoly') return interaction.reply({ content: "No game of Monopoly is going on right now.", flags: 'Ephemeral' });
            if (!Client.activeGame?.players.has(interaction.member.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}.`, flags: 'Ephemeral' });
            if (interaction.member.id !== Client.activeGame.queue[0]) return interaction.reply({ content: "It is currently not your turn!", flags: 'Ephemeral' });
            if (!Client.activeGame.canBuy) return interaction.reply({ content: "There is nothing you can buy right now.", flags: 'Ephemeral' });
            Client.activeGame.onBuy(interaction);
        }
    },
    summary: {
        options: [
            {
                type: ApplicationCommandOptionType.User,
                name: 'player',
                description: "The player you want to see the details of."
            }
        ],
        desc: "Shows the player details in the game of Monopoly.",
        execute(interaction) {
            if (Client.activeGame?.id !== 'monopoly') return interaction.reply({ content: "No game of Monopoly is going on right now.", flags: 'Ephemeral' });
            if (!Client.activeGame.started) return interaction.reply({ content: "The game hasn't started yet.", flags: 'Ephemeral' });

            const userId = interaction.options?._hoistedOptions[0].value || interaction.mentions.users.first()?.id;
            if (userId && !Client.activeGame.players.has(userId)) return interaction.reply("The specified player is not in the current game.");
            interaction.reply({ embeds: [Client.activeGame.getSummary(userId)], flags: 'Ephemeral' });
        }
    },
    bail: {
        desc: "Bail out of Jail in the game of Monopoly.",
        async execute(interaction) {
            if (Client.activeGame?.id !== 'monopoly') return interaction.reply({ content: "No game of Monopoly is going on right now.", flags: 'Ephemeral' });
            if (!Client.activeGame?.players.has(interaction.member.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}.`, flags: 'Ephemeral' });
            if (interaction.member.id !== Client.activeGame.queue[0]) return interaction.reply({ content: "It is currently not your turn!", flags: 'Ephemeral' });
            if (!Client.activeGame.players.get(interaction.member.id).inJail) return interaction.reply({ content: "You are not in **Jail** \\⛓️.", flags: 'Ephemeral' });
            if (!Client.activeGame.canBail) return interaction.reply({ content: "You cannot bail out of **Jail** \\⛓️ right now.", flags: 'Ephemeral' });
            await interaction.reply(`<@${interaction.member.id}> bailed out of **Jail**!`);
            Client.activeGame.onResolveJail('bail');
        }
    },
    rolldice: {
        desc: "Roll dice to get out of Jail in the game of Monopoly.",
        async execute(interaction) {
            if (Client.activeGame?.id !== 'monopoly') return interaction.reply({ content: "No game of Monopoly is going on right now.", flags: 'Ephemeral' });
            if (!Client.activeGame?.players.has(interaction.member.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}.`, flags: 'Ephemeral' });
            if (interaction.member.id !== Client.activeGame.queue[0]) return interaction.reply({ content: "It is currently not your turn!", flags: 'Ephemeral' });
            if (!Client.activeGame.players.get(interaction.member.id).inJail) return interaction.reply({ content: "You are not in **Jail** \\⛓️.", flags: 'Ephemeral' });
            if (!Client.activeGame.canBail) return interaction.reply({ content: "You cannot rolldice to try and get out of **Jail** \\⛓️ right now.", flags: 'Ephemeral' });
            await interaction.reply(`<@${interaction.member.id}> decided to roll dice to try and get out of **Jail** \\⛓️!`);
            Client.activeGame.onResolveJail('dice');
        }
    },
    uno: {
        desc: "Declare UNO! in the game of UNO.",
        execute(interaction) {
            if (Client.activeGame?.id !== 'uno') return interaction.reply({ content: "No game of UNO is going on right now.", flags: 'Ephemeral' });
            if (!Client.activeGame?.players.has(interaction.member.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}.`, flags: 'Ephemeral' });
            if (!Client.activeGame.started) return interaction.reply({ content: "The game hasn't started yet.", flags: 'Ephemeral' });
            Client.activeGame.declareUno(interaction);
        }
    },
    play: {
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: 'card',
                description: "The card that you want to play.",
                required: true
            }
        ],
        desc: "Play a card in the game of UNO.",
        execute(interaction) {
            if (Client.activeGame?.id !== 'uno') return interaction.reply({ content: "No game of UNO is going on right now.", flags: 'Ephemeral' });
            if (!Client.activeGame?.players.has(interaction.member.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}.`, flags: 'Ephemeral' });
            if (!Client.activeGame.started) return interaction.reply({ content: "The game hasn't started yet.", flags: 'Ephemeral' });
            if (interaction.member.id !== Client.activeGame.queue[0]) return interaction.reply({ content: "It is currently not your turn!", flags: 'Ephemeral' });
            Client.activeGame.play(interaction);
        }
    },
    draw: {
        desc: "Draw a card in the game of UNO.",
        execute(interaction) {
            if (Client.activeGame?.id !== 'uno') return interaction.reply({ content: "No game of UNO is going on right now.", flags: 'Ephemeral' });
            if (!Client.activeGame?.players.has(interaction.member.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}.`, flags: 'Ephemeral' });
            if (!Client.activeGame.started) return interaction.reply({ content: "The game hasn't started yet.", flags: 'Ephemeral' });
            if (interaction.member.id !== Client.activeGame.queue[0]) return interaction.reply({ content: "It is currently not your turn!", flags: 'Ephemeral' });
            Client.activeGame.draw(interaction);
        }
    },
    hand: {
        desc: "View your hand of cards in the game of UNO.",
        execute(interaction) {
            if (Client.activeGame?.id !== 'uno') return interaction.reply({ content: "No game of UNO is going on right now.", flags: 'Ephemeral' });
            if (!Client.activeGame?.players.has(interaction.member.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}.`, flags: 'Ephemeral' });
            if (!Client.activeGame.started) return interaction.reply({ content: "The game hasn't started yet.", flags: 'Ephemeral' });
            if (interaction.content) return interaction.reply("You can only view your hand using Hand button or the slash command.");
            Client.activeGame.showHand(interaction);
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
