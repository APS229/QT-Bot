'use strict';

const http = require('http');
const fs = require('fs');
const DAY = 1000 * 60;
const WEEK = 1000 * 60 * 2;

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

            // const lastDailyAnnouncement = parseInt(fs.readFileSync('./database/lastDailyAnnouncement.txt', 'utf8'));
            // const lastWeeklyAnnouncement = parseInt(fs.readFileSync('./database/lastWeeklyAnnouncement.txt', 'utf8'));
            // if (Date.now() - lastDailyAnnouncement > DAY) {
            // 	Client.events.countRebelsDaily();
            // }
            // else global.dailyTimer = setTimeout(Client.events.countRebelsDaily, (lastDailyAnnouncement + DAY) - Date.now());
            // if (Date.now() - lastWeeklyAnnouncement > WEEK) {
            // 	Client.events.countRebelsWeekly();
            // }
            // else global.weeklyTimer = setTimeout(Client.events.countRebelsWeekly, (lastWeeklyAnnouncement + WEEK) - Date.now());
        });
        this.bot.on('shardError', err => {
            console.error(err);
        });
        this.bot.on('shardDisconnect', () => {
            info("Disconnected from client");
        });
        this.bot.on('shardReconnecting', () => {
            info("Reconnecting...");
            clearTimeout(global.dailyTimer);
            clearTimeout(global.weeklyTimer);
        });
        this.bot.on('shardResume', () => {
            info("Re-connected to client");
            // const lastDailyAnnouncement = parseInt(fs.readFileSync('./database/lastDailyAnnouncement.txt', 'utf8'));
            // const lastWeeklyAnnouncement = parseInt(fs.readFileSync('./database/lastWeeklyAnnouncement.txt', 'utf8'));
            // if (Date.now() - lastDailyAnnouncement > DAY) {
            // 	Client.events.countRebelsDaily();
            // }
            // else global.dailyTimer = setTimeout(Client.events.countRebelsDaily, (lastDailyAnnouncement + DAY) - Date.now());
            // if (Date.now() - lastWeeklyAnnouncement > WEEK) {
            // 	Client.events.countRebelsWeekly();
            // }
            // else global.weeklyTimer = setTimeout(Client.events.countRebelsDaily, (lastWeeklyAnnouncement + WEEK) - Date.now());
        });

        this.bot.on('messageCreate', async function (discord) {
            const channel = discord.channel;
            const user = discord.author;
            const message = discord.content;
            const server = discord.guild;
            // this.setPrototypes(user, channel);
            user.isDev = () => Config.developers.includes(user.id); // inconsistent
            if (channel.type === 'text' && user.guild && user.id === user.guild.ownerID) user.owner = true;
            // if (user.id === '270904126974590976' && discord.type === 'REPLY' && discord.mentions.users.first()) {
            //     const pointsFor = discord.mentions.users.first().id;
            //     let points = 0;
            //     if (message.includes("TINY portion")) {
            //         points = 1;
            //     } else if (message.includes("small portion")) {
            //         points = 2;
            //     } else if (message.includes("decent chunk")) {
            //         points = 3;
            //     } else if (message.includes("BASICALLY EVERYTHING")) {
            //         points = 4;
            //     }
            //     if (points) {
            //         if (Db('dank').has(pointsFor)) points += Db('dank').get(pointsFor);
            //         Db('dank').set(pointsFor, points);
            //     }
            // }
            if (user.bot) return;
            // if (channel.name === 'hit-or-miss' && message && (!message.startsWith('||') || !message.endsWith('||'))) {
            // 	channel.say(`${user} please spoiler your messages in this channel.`);
            // 	return channel.messages.delete(discord.id);
            // }
            if (discord.mentions.users.first() && discord.mentions.users.first().id === Config.id && message.startsWith('<@') && message.includes(Config.id)) {
                const question = message.slice(`<@${Config.id}>`.length + 1);
                http.get(`http://qmarkai.com/qmai.php?q=${question}`, (res, err) => {
                    if (err) console.log(err);
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => channel.say(data));
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
                    channel.say("There was an error occured. Developers have been notified.");
                    for (const dev of Config.developers) {
                        const user = await Client.bot.users.fetch(dev);
                        if (user) user.say(err.name + ': ' + err.message);
                    }
                    console.log(err);
                }
            }

            if (Config.excludedCh.includes(channel.name)) {
                Database.query(`select * from profile where id = '${user.id}'`, (err, res) => {
                    if (err) return console.log(err);
                    if (res.rows.length) {
                        channel.say(res.rows[0]);
                        // const xp = res.rows[0].xp + 10;
                        // Database.query(`update profile set xp = ${xp} where id = '${user.id}'`, (err, res) => {
                        //     if (err) return console.log(err);
                        //     channel.say(res.rows[0].xp);
                        // });
                    }
                    else {
                        channel.say("no data found");
                        // Database.query(`insert into profile values('${user.id}', 1, 0, 0)`, (err, res) => {
                        //     if (err) return console.log(err);
                        //     channel.say(res.rows[0]);
                        // });
                    }

                });
            }
            // if (channel.name === 'rebel-kills') {
            // 	if (!discord.attachments.size) return;
            // 	if (!Db('rebel-kills-count').has(user.id)) Db('rebel-kills-count').set(user.id, {});
            // 	const rebelKills = Db('rebel-kills-count').get(user.id, {});
            // 	if (!rebelKills.count) rebelKills.count = 0;
            // 	if (!rebelKills.daily) rebelKills.daily = 0;
            // 	if (!rebelKills.weekly) rebelKills.weekly = 0;
            // 	rebelKills.count++;
            // 	rebelKills.daily++;
            // 	rebelKills.weekly++;
            // 	Db('rebel-kills-count').set(user.id, rebelKills);
            // 	const rebelHuntersCh = server.channels.cache.find(ch => ch.name === 'rebel-hunters');
            // 	const member = await server.members.fetch(user);
            // 	if (rebelKills.count === 100) {
            // 		const role = server.roles.cache.find(r => r.name.endsWith('[100]'));
            // 		member.roles.add(role);
            // 		const embed = new Client.discord.MessageEmbed()
            // 		.setDescription(`**:tada: Congratulations to ${member} for passing over __${rebelKills.count}__ rebel hunting screenshots. :tada:**\n\nThey were awarded the role ${role}!`);
            // 		rebelHuntersCh.send({embed});
            // 	}
            // 	else if (rebelKills.count === 200) {
            // 		const role = server.roles.cache.find(r => r.name.endsWith('[200]'));
            // 		member.roles.add(role);
            // 		const embed = new Client.discord.MessageEmbed()
            // 		.setDescription(`**:tada: Congratulations to ${member} for passing over __${rebelKills.count}__ rebel hunting screenshots. :tada:**\n\nThey were awarded the role ${role}!`);
            // 		rebelHuntersCh.send({embed});
            // 	}
            // 	else if (rebelKills.count === 300) {
            // 		const role = server.roles.cache.find(r => r.name.endsWith('[300]'));
            // 		member.roles.add(role);
            // 		const embed = new Client.discord.MessageEmbed()
            // 		.setDescription(`**:tada: Congratulations to ${member} for passing over __${rebelKills.count}__ rebel hunting screenshots. :tada:**\n\nThey were awarded the role ${role}!`);
            // 		rebelHuntersCh.send({embed});
            // 	}
            // 	else if (rebelKills.count === 500) {
            // 		const role = server.roles.cache.find(r => r.name.endsWith('[500]'));
            // 		member.roles.add(role);
            // 		const embed = new Client.discord.MessageEmbed()
            // 		.setDescription(`**:tada: Congratulations to ${member} for passing over __${rebelKills.count}__ rebel hunting screenshots. :tada:**\n\nThey were awarded the role ${role}!`);
            // 		rebelHuntersCh.send({embed});
            // 	}
            // 	else if (rebelKills.count === 1000) {
            // 		const role = server.roles.cache.find(r => r.name.endsWith('[1000]'));
            // 		member.roles.add(role);
            // 		const embed = new Client.discord.MessageEmbed()
            // 		.setDescription(`**:tada: Congratulations to ${member} for passing over __${rebelKills.count}__ rebel hunting screenshots. :tada:**\n\nThey were awarded the role ${role}!`);
            // 		rebelHuntersCh.send({embed});
            // 	}
            // 	else if (rebelKills.count === 2000) {
            // 		const role = server.roles.cache.find(r => r.name.endsWith('[2000]'));
            // 		member.roles.add(role);
            // 		const embed = new Client.discord.MessageEmbed()
            // 		.setDescription(`**:tada: Congratulations to ${member} for passing over __${rebelKills.count}__ rebel hunting screenshots. :tada:**\n\nThey were awarded the role ${role}!`);
            // 		rebelHuntersCh.send({embed});
            // 	}
            // 	else if (rebelKills.count === 3000) {
            // 		const role = server.roles.cache.find(r => r.name.endsWith('[3000]'));
            // 		member.roles.add(role);
            // 		const embed = new Client.discord.MessageEmbed()
            // 		.setDescription(`**:tada: Congratulations to ${member} for passing over __${rebelKills.count}__ rebel hunting screenshots. :tada:**\n\nThey were awarded the role ${role}!`);
            // 		rebelHuntersCh.send({embed});
            // 	}
            // }
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

        // this.bot.on('messageDelete', message => {
        // 	// logging deleted messages
        // 	const channel = message.channel.guild.channels.cache.find(ch => ch.name === 'logs');
        // 	if (channel && message.channel.name !== 'moderation' && message.channel.name !== 'super-moderation' && message.channel.name !== 'pings') {
        // 		channel.say(`Deleted message in channel #${message.channel.name} by the user ${message.author.username}#${message.author.discriminator}:`);
        // 		if (message.content) channel.say('> ' + message.content);
        // 		if (message.attachments.size) {
        // 			for (const att of message.attachments) {
        // 				channel.say(att[1].proxyURL);
        // 			}
        // 		}
        // 	}
        // 	// counting total rebel kills
        // 	if (message.channel.name === 'rebel-kills' && message.attachments) {
        // 		if (!Db('rebel-kills-count').has(message.author.id)) Db('rebel-kills-count').set(message.author.id, {count: 0, daily: 0, weekly: 0});
        // 		const rebelKills = Db('rebel-kills-count').get(message.author.id, {});
        // 		if (rebelKills.count) rebelKills.count--;
        // 		if (rebelKills.daily) rebelKills.daily--;
        // 		if (rebelKills.weekly) rebelKills.weekly--;
        // 		Db('rebel-kills-count').set(message.author.id, rebelKills);
        // 	}
        // });
        // this.bot.on('messageUpdate', (oldMessage, newMessage) => {
        // 	if (oldMessage.content === newMessage.content) return;
        // 	const channel = oldMessage.channel.guild.channels.cache.find(ch => ch.name === 'logs');
        // 	if (channel && oldMessage.channel.name !== 'moderation' && oldMessage.channel.name !== 'super-moderation' && oldMessage.channel.name !== 'pings') {
        // 		channel.say(`Edited message in channel #${oldMessage.channel.name} by the user ${oldMessage.author.username}#${oldMessage.author.discriminator}:`);
        // 		channel.say('> ' + oldMessage.content);
        // 		channel.say('to');
        // 		channel.say('> ' + newMessage.content);
        // 	}
        // });
    }
    // async countRebelsDaily() {
    // 	let highest = 0;
    // 	const winners = [];
    // 	const channel = await Client.bot.channels.fetch('838693149413081100'); // server: .. | channel: rebel-hunters
    // 	const role = channel.guild.roles.cache.find(role => role.name.endsWith('[Day]'));
    // 	for (const value of Db('rebel-kills-count').values()) {
    // 		if (value.daily > highest) highest = value.daily;
    // 	}
    // 	for (const user of Db('rebel-kills-count').keys()) {
    // 		const members = await channel.guild.members.fetch();
    // 		if (!members.has(user)) continue;
    // 		const member = await channel.guild.members.fetch(user);
    // 		if (highest && Db('rebel-kills-count').get(user).daily === highest) winners.push(member);
    // 		const prof = Db('rebel-kills-count').get(user, {});
    // 		prof.daily = 0;
    // 		Db('rebel-kills-count').set(user, prof);
    // 	}
    // 	const oldWinners = [];
    // 	for (const member of (await channel.guild.members.fetch()).values()) {
    // 		if (member.roles.cache.has(role.id)) member.roles.remove(role);
    // 	}
    // 	for (const winner of winners) {
    // 		winner.roles.add(role);
    // 	}
    // 	let desc = '';
    // 	if (winners.length) {
    // 		desc = `:tada: Congratulations to user${winners.length > 1 ? 's' : ''} ${winners.join(', ')} for hunting **${highest}** rebels today! :tada: \n\nThey were awarded the role ${role}!`;
    // 	}
    // 	else desc = "No one has hunted any rebels today!";
    // 	const embed = new Client.discord.MessageEmbed()
    // 	.setTitle(":clock12: The day is over. :clock12:")
    // 	.setDescription(desc);
    // 	channel.send(embed);
    // 	global.dailyTimer = setTimeout(Client.events.countRebelsDaily, DAY);
    // 	fs.writeFileSync('./database/lastDailyAnnouncement.txt', Date.now() + '');
    // }
    // async countRebelsWeekly() {
    // 	let highest = 0;
    // 	const winners = [];
    // 	const channel = await Client.bot.channels.fetch('838693149413081100'); // server: .. | channel: rebel-hunters
    // 	const role = channel.guild.roles.cache.find(role => role.name.endsWith('[Week]'));
    // 	for (const value of Db('rebel-kills-count').values()) {
    // 		if (value.weekly > highest) highest = value.weekly;
    // 	}
    // 	for (const user of Db('rebel-kills-count').keys()) {
    // 		const members = await channel.guild.members.fetch();
    // 		if (!members.has(user)) continue;
    // 		const member = await channel.guild.members.fetch(user);
    // 		if (highest && Db('rebel-kills-count').get(user).weekly === highest) winners.push(member);
    // 		const prof = Db('rebel-kills-count').get(user, {});
    // 		prof.weekly = 0;
    // 		Db('rebel-kills-count').set(user, prof);
    // 	}
    // 	const oldWinners = [];
    // 	for (const member of (await channel.guild.members.fetch()).values()) {
    // 		if (member.roles.cache.has(role.id)) member.roles.remove(role);
    // 	}
    // 	for (const winner of winners) {
    // 		winner.roles.add(role);
    // 	}
    // 	let desc = '';
    // 	if (winners.length) {
    // 		desc = `:tada: Congratulations to user${winners.length > 1 ? 's' : ''} ${winners.join(', ')} for hunting **${highest}** rebels this week! :tada: \n\nThey were awarded the role ${role}!`;
    // 	}
    // 	else desc = "No one has hunted any rebels this week!";
    // 	const embed = new Client.discord.MessageEmbed()
    // 	.setTitle(":clock12: The week is over. :clock12:")
    // 	.setDescription(desc);
    // 	channel.send(embed);
    // 	global.weeklyTimer = setTimeout(Client.events.countRebelsWeekly, WEEK);
    // 	fs.writeFileSync('./database/lastWeeklyAnnouncement.txt', Date.now() + '');
    // }
}

module.exports = Events;
