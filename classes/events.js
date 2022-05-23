'use strict';

const http = require('http');

class Events {
    constructor(client) {
        this.bot = client;
    }
    parse() {
        this.bot.on('ready', async () => {
            if (Config.username) this.bot.user.setUsername(Config.username);
            info(`Logged in as: ${this.bot.user.username}`);
            const servers = [];
            for (const guild of this.bot.guilds.cache) {
                servers.push(`${guild[1].name} - ${guild[1].id}`);
            }
            if (!servers.length) return;
            info(`Connected to server${servers.length > 1 ? 's' : ''}:\n\t\u00b0 ${servers.sort().join('\n\t\u00b0 ')}`);
            if (Config.activity) this.bot.user.setActivity('use .help for commands', { type: Config.activity });
            this.bot.guilds.fetch('777956702741463070').then(g => {
                g.commands.set([
                    { name: 'hand', description: 'Show your cards in the UNO game.' },
                    { name: 'draw', description: 'Draw a card in the UNO game.' },
                    { name: 'uno', description: 'Use this command when you have 1 card left in UNO.' },
                    { name: 'play', description: 'Play a card in the UNO game.', options: [{ type: 'STRING', name: 'card', description: 'Card.', required: true }] }
                ]);
            });
        });
        this.bot.on('shardError', err => {
            console.error(err);
        });
        this.bot.on('shardDisconnect', () => {
            info("Disconnected from client");
        });
        this.bot.on('shardReconnecting', () => {
            info("Reconnecting...");
        });
        this.bot.on('shardResume', () => {
            info("Re-connected to client");
        });

        this.bot.on('messageCreate', async function (discord) {
            const channel = discord.channel;
            const user = discord.author;
            const message = discord.content;
            const server = discord.guild;
            user.isDev = () => Config.developers.includes(user.id); // inconsistent
            if (channel.type === 'text' && user.guild && user.id === user.guild.ownerID) user.owner = true;
            if (server.id === '978201529397948466' && user.id === '270904126974590976' && message.type === 'REPLY') {
                let points = 0;
                const id = channel.messages.fetch(message.reference.messageId).author.id;
                if (message.includes("TINY portion")) {
                    points = 1;
                }
                else if (message.includes("small portion")) {
                    points = 2;
                }
                else if (message.includes("decent chunk")) {
                    points = 3;
                }
                else if (message.includes("BASICALLY EVERYTHING")) {
                    points = 5;
                }
                else {
                    return;
                }
                if (id) {
                    Database.query(`select * from rob_event where id = '${id}'`).then(res => {
                        if (res.rows.length) {
                            Database.query(`update rob_event set points = points + ${points} where id = '${id}'`);
                        }
                        else {
                            Database.query(`insert into rob_event values('${id}', ${points})`);
                        }
                    });
                }
                return console.log("Points added to " + id + ", " + points);
            }
            if (user.bot) return;
            if (channel.name === 'hit-or-miss' && message && (!message.startsWith('||') || !message.endsWith('||'))) {
                channel.say(`${user} please spoiler your messages in this channel.`);
                return channel.messages.delete(discord.id);
            }
            if (discord.mentions.users.first() && discord.mentions.users.first().id === Config.id && message.startsWith('<@') && message.includes(Config.id)) {
                const question = message.slice(`<@${Config.id}>`.length + 1);
                http.get(`http://qmarkai.com/qmai.php?q=${question}`, (res, err) => {
                    if (err) console.log(err);
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => channel.say(data));
                });
            }
            if (!Config.excludedCh.includes(channel.name)) {
                Database.query(`select * from profile where id = '${user.id}'`).then(res => {
                    if (res.rows.length) {
                        let xp = res.rows[0].xp + 10;
                        let update = "";
                        if (xp >= res.rows[0].toxp) {
                            xp -= res.rows[0].toxp;
                            update = ", level=level+1";
                            const level = res.rows[0].level;
                            if (level > 1) {
                                let base = 220;
                                for (let i = 0; i < level; base += 75 + i * 10, i++) { }
                                update += ", toxp=" + base;
                            }
                            else {
                                update += ", toxp=toxp+75";
                            }
                        }
                        Database.query(`update profile set xp = ${xp}${update} where id = '${user.id}'`).then(res => {
                            channel.say(res.rows[0]);
                        });
                    }
                    else {
                        Database.query(`insert into profile values('${user.id}', 1, 0, 220, 0)`).then(res => {
                            channel.say(res.rows[0]);
                        });
                    }
                });
            }
            if (message.startsWith(Config.cmdchar)) {
                try {
                    const target = message.slice(Config.cmdchar.length).split(' ').slice(1).join(' ');
                    const commandName = message.slice(Config.cmdchar.length).split(' ')[0].toLowerCase();
                    const command = Client.commands.get(commandName) || Client.commands.find(cmd => cmd.aliases.length && cmd.aliases.includes(commandName));

                    if (!command) return;
                    if ((Client.disabled || command.devOnly) && !user.isDev()) return;
                    if (channel.type === 'GUILD_TEXT') {
                        const member = await server.members.fetch(user);
                        if (command.supermod && !member.roles.cache.find(r => r.name === 'Super Moderator') && !user.isDev()) return;
                        if (command.mod && !member.roles.cache.find(r => r.name === 'Moderator' || r.name === 'Super Moderator') && !user.isDev()) return;
                        if (command.target && !target) return channel.say("This command needs an argument.");
                        if (command.cooldown && Date.now() - command.cooldown < 60000) return channel.say(`You need to wait ${Tools.toDurationString(60000 - (Date.now() - command.cooldown))} before using this command again.`);
                    }
                    if (command.server && channel.type !== 'GUILD_TEXT') return channel.say("This command is only available in servers.");
                    if (command.execute) command.execute(target, channel, user, server, discord);
                }
                catch (err) {
                    channel.say("There was an error occured.");
                    for (const dev of Config.developers) {
                        const user = await Client.bot.users.fetch(dev);
                        if (user) user.say(err.name + ': ' + err.message);
                    }
                    console.log(err);
                }
            }
        });
        this.bot.on('interactionCreate', interaction => {
            try {
                if ((interaction.customId === 'hand' || interaction.commandName === 'hand') && Client.activeGame?.players?.has(interaction.user.id)) return interaction.reply({ content: Client.activeGame.showHand(interaction.user.id), ephemeral: true });
                if ((interaction.customId === 'draw' || interaction.commandName === 'draw') && Client.activeGame?.id === 'uno') return Client.activeGame.drawPlayer(interaction);
                if ((interaction.customId?.startsWith('play') || interaction.commandName === 'play') && Client.activeGame?.id === 'uno') return Client.activeGame.play(interaction);
                if ((interaction.customId === 'uno' || interaction.commandName === 'uno') && Client.activeGame?.players?.get(interaction.user.id)?.cards.length === 1 && !Client.activeGame?.players?.get(interaction.user.id).uno) {
                    interaction.reply(`${interaction.member.displayName} has 1 card left!`);
                    return Client.activeGame.players.get(interaction.user.id).uno = true;
                }
            }
            catch (err) {
                interaction.reply("There was an error occured.");
                console.log(err);
            }
        });
        // user Joining/leaving server
        this.bot.on('guildMemberAdd', member => {

        });
        this.bot.on('guildMemberRemove', member => {

        });

        // adding and removing bot from servers
        this.bot.on('guildCreate', guild => {
            info(`Joined new server: ${guild.name} - ${guild.id}`);
        });
        this.bot.on('guildDelete', guild => {
            info(`Left server: ${guild.name} - ${guild.id}`);
        });

        // emoji reactions on last message
        this.bot.on('messageReactionAdd', async function (reaction, user) {
            if (user.bot || reaction.message.channelId !== '865985989041586207' || !Client.nicknames.has(reaction.message.id)) return;
            if (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') {
                if (reaction.emoji.name === '✅') {
                    const data = Client.nicknames.get(reaction.message.id);
                    const server = await Client.bot.guilds.fetch(reaction.message.guildId);
                    const member = await server.members.fetch(data.user);
                    try {
                        member.setNickname(data.nick);
                    }
                    catch (err) { }
                }
                reaction.message.delete();
                Client.nicknames.delete(reaction.message.id);
            }
        });
    }
}

module.exports = Events;
