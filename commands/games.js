'use strict';

const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const commands = {
    game: {
        description: "",
        slashCommand: true,
        subcommands: {
            create: {
                description: "Create a new game.",
                modOnly: true,
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
                async execute(interaction, target) {
                    if (Client.activeGame) return interaction.reply({ content: `There's already a game of ${Client.activeGame.name} going on in <#${Client.activeGame.channel.id}>.`, flags: 'Ephemeral' });
                    const targetGame = Tools.toId(target ? target.split(' ')[0] : Tools.toId(interaction.options?.get('game').value));
                    if (!Client.games.has(targetGame)) return interaction.reply({ content: `The game you specified is not a valid game.\nAvailable games: ${[...Client.games.keys()].join(', ')}`, flags: 'Ephemeral' });
                    const points = target ? parseInt(target.split(' ')[1]) : interaction.options?.get('points')?.value;
                    if (points && points > 15 || points < 5) return interaction.reply({ content: "Points must be between 5 - 15.", flags: 'Ephemeral' });
                    const game = Client.games.get(targetGame);
                    const host = {
                        id: interaction.member.id,
                        tag: interaction.user?.tag || interaction.author?.tag,
                        icon: interaction.member.avatarURL() ? interaction.member.avatarURL() : (interaction.user?.avatarURL() || interaction.author?.avatarURL())
                    };
                    Client.activeGame = await game.create(interaction.channel, host, points);
                    interaction.reply({ content: `Successfully created a new game of ${Client.activeGame.name}!`, flags: 'Ephemeral' });
                }
            },
            join: {
                description: "Join the current game.",
                execute(interaction) {
                    if (!Client.activeGame) return interaction.reply({ content: "There is no game going on right now.", flags: 'Ephemeral' });
                    if (Client.activeGame.freejoin) return interaction.reply({ content: "This game is free to play, you don't have to join.", flags: 'Ephemeral' });
                    if (Client.activeGame.started) return interaction.reply({ content: "The game has already been started.", flags: 'Ephemeral' });

                    if (Client.activeGame.players.has(interaction.member.id)) return interaction.reply({ content: "You have already joined this game!", flags: 'Ephemeral' });
                    if (Client.activeGame.players.size === Client.activeGame.maxPlayers) return interaction.reply({ content: "Max amount of players have been reached for this game.", flags: 'Ephemeral' });
                    Client.activeGame.onJoin({ id: interaction.member.id, tag: interaction.member.user.tag });
                    interaction.reply({ content: `You have successfully joined the game of ${Client.activeGame.name}!`, flags: 'Ephemeral' });
                }
            },
            leave: {
                description: "Leave the current game.",
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
                description: "Disqualify a player from the current game.",
                modOnly: true,
                options: [
                    {
                        type: ApplicationCommandOptionType.User,
                        name: 'user',
                        description: "User you want to disqualify.",
                        required: true
                    }
                ],
                execute(interaction, target) {
                    if (!Client.activeGame) return interaction.reply({ content: "There is no game going on right now.", flags: 'Ephemeral' });
                    const userId = target ? interaction.mentions.users.first()?.id : interaction.options?.get('user').value;
                    if (!userId || !Client.activeGame.players.has(userId)) return interaction.reply({ content: "You must specify a player in the game.", flags: 'Ephemeral' });
                    interaction.reply(`<@${userId}> has been disqualified.`);
                    Client.activeGame.onLeave(userId);
                }
            },
            players: {
                description: "List all players in the current game.",
                modOnly: true,
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
            summary: {
                description: "Shows the player details in the game of Monopoly.",
                slashCommand: true,
                options: [
                    {
                        type: ApplicationCommandOptionType.User,
                        name: 'player',
                        description: "The player you want to see the details of."
                    }
                ],
                execute(interaction, target) {
                    if (Client.activeGame?.id !== 'monopoly') return interaction.reply({ content: "No game of Monopoly is going on right now.", flags: 'Ephemeral' });
                    if (!Client.activeGame.started) return interaction.reply({ content: "The game hasn't started yet.", flags: 'Ephemeral' });

                    const userId = target ? interaction.mentions.users.first()?.id : interaction.options?.get('player').value;
                    if (userId && !Client.activeGame.players.has(userId)) return interaction.reply("The specified player is not in the current game.");
                    interaction.reply({ embeds: [Client.activeGame.getSummary(userId)], flags: 'Ephemeral' });
                }
            },
            start: {
                description: "Start the current game.",
                modOnly: true,
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
            end: {
                description: "End the current game.",
                modOnly: true,
                execute(interaction) {
                    if (!Client.activeGame) return interaction.reply({ content: "There is no game going on right now.", flags: 'Ephemeral' });
                    interaction.reply(`The game of ${Client.activeGame.name} was forcibly ended.`);
                    Client.activeGame.onEnd();
                }
            },
        }
    },
    guess: {
        description: "Guess an answer in the current game.",
        execute(interaction, target) {
            if (!Client.activeGame) return interaction.reply("There is no game going on right now.");
            if (Client.activeGame.type !== 'puzzle' && Client.activeGame.id !== 'russianroulette' && Client.activeGame.id !== 'empires') return;
            if (Client.activeGame.type === 'puzzle' && !Client.activeGame.canGuess) return;
            if (Client.activeGame.id === 'empires') return Client.textCommands.get('guessalias').execute(interaction, target);
            Client.activeGame.onGuess(interaction.member.id, Tools.toId(target));
        }
    },
    // convert to text command
    bid: {
        description: "Bid a number during a game.",
        execute(interaction, target) {
            if (!Client.activeGame) return interaction.reply({ content: "No game is going on right now.", flags: 'Ephemeral' });
            if (!Client.activeGame.players.has(interaction.member.id)) return interaction.reply({ content: `You are not in the current game of ${Client.activeGame.name}.`, flags: 'Ephemeral' });
            if (Client.activeGame.id === 'dicedisaster') {
                if (!Client.activeGame.canGuess) return interaction.reply({ content: "Please wait until the next round.", flags: 'Ephemeral' });
                Client.activeGame.onGuess(interaction.member.id, target);
            }
            else if (Client.activeGame.id === 'monopoly') {
                if (!Client.activeGame.canBid) return interaction.reply({ content: "There is no property you can bid on right now.", flags: 'Ephemeral' });
                Client.activeGame.onBid(interaction, target);
            }
            else {
                interaction.reply({ content: "This game does not have anything to bid for.", flags: 'Ephemeral' });
            }
        }
    },
    animals: {
        description: "Lists all animals from the database.",
        modOnly: true,
        execute(interaction) {
            const animals = JSON.parse(fs.readFileSync('./database/categories.json')).animals.sort();
            interaction.reply("```" + animals.join(', ') + "```");
        }
    }
};

exports.commands = commands;
