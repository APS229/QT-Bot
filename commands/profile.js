'use strict';

const validCmds = ['set', 'birthday', 'nickname', 'balance'];
const validItems = ['name', 'birthday', 'nickname'];
const fs = require('fs');

let embed;
function setHelp(user) {
	embed = new Client.discord.MessageEmbed()
	.setAuthor('Profile help', Config.avatarURL)
	.setDescription('Help commands for command profile')
	.addField('.profile', 'Shows your profile.')
	.addField('.profile [item]', 'Shows the item of specificed category in your profile.')
	.addField('.profile set [item] [info]', 'Sets the specified item with the given information.')
	.setTimestamp()
	.setFooter(`Requested by ${user.username}`, user.avatarURL);
}

const commands = {
	profile: {
		server: true,
		desc: 'Shows your\'s and other\'s profiles as well as edit your own profile.',
		usage: ['.profile', '.profile @user', '.profile [item]', '.profile set [item] [info]', '.profile help'],
		showProfile(user, channel) {
			const id = user.id;
			if (!Db('profiles').has(id)) Db('profiles').set(id, {});
			const profile = Db('profiles').get(id, {});
			if (!profile.nickname) profile.nickname = 'Not set.';
			if (!profile.birthday) profile.birthday = 'Not set';
			if (isNaN(profile.balance)) profile.balance = 0;
			if (!profile.items) profile.items = [];
			Db('profiles').set(id, profile);

			const items = Object.keys(profile.items);
			const embed = new Client.discord.MessageEmbed()
			.setAuthor(`${user.username}'s profile`, user.avatarURL)
			.setTimestamp()
			.setFooter(Config.username, Config.avatarURL)
			.setThumbnail(user.avatarURL)
			.addField('Nickname', profile.nickname)
			.addField(':confetti_ball: Birthday', profile.birthday)
			.addField(`${emote.dollar} Balance`, `$${profile.balance}`)
			.addField(`Products`, items.length ? getItems() : 'None');

			function getItems() {
				const realItems = [];
				for (let i = 0 ; i  < items.length; i++) {
					const item = {name: items[i], q: profile.items[items[i]]};
					item.emoji = Client.shop.shop[Tools.toId(item.name)].emoji;
					realItems.push(`${item.q} ${item.name}${item.q > 1 ? 's': ''} ${item.emoji}`);
				}
				return realItems.join('\n');
			}
			channel.send({embed});
		},
		execute(target, channel, user, server, client) {
			setHelp(user);
			if (!fs.existsSync('./database/profiles.json')) fs.writeFile('./database/profiles.json', '{}');
			const profile = Db('profiles').get(user.id, {});
			if (!profile.nickname) profile.nickname = 'Not set.';
			if (!profile.birthday) profile.birthday = 'Not set';
			if (isNaN(profile.balance)) profile.balance = 0;
			if (!profile.items) profile.items = [];
			if (!target) return this.showProfile(user, channel, server);
			const mentionedUser = client.mentions.users.first();
			if (mentionedUser) return this.showProfile(mentionedUser, channel);

			let [cmd, item, ...info] = target.split(/ +/);
			cmd = Tools.toId(cmd), item = Tools.toId(item), info = info[0];

			switch (cmd) {
				case 'help':
					channel.send({embed});
				break;
				case 'birthday':
					channel.say(`:confetti_ball: Birthday: ${profile.birthday}`);
					break;
				case 'nickname':
				case 'nick':
					channel.say(`Nickname: ${profile.nickname}`);
				break;
				case 'balance':
				case 'bal':
					channel.say(`${emote.dollar} Balance: ${profile.balance}$`);
				break;
				case 'set': {
					if (!item) return channel.say(`Usage: ${Config.cmdchar}profile set [item] [info]`);
					if (item && !info) return channel.say(`Usage: ${Config.cmdchar}profile set ${item} [info]`);
					switch (item) {
						case 'birthday':
							info = info.split('-');
							if (info.length !== 3) return channel.say(`Usage: ${Config.cmdchar}profile set ${item} day-month-year`);
							if (info[2].length === 2) info[2] = '20' + info[2];
							if (info[2].length === 1) info[2] = '200' + info[2];
							if (info[1].length === 1) info[1] = '0' + info[1];
							if (info[0].length === 1) info[0] = '0' + info[0];
							const int = parseInt(info[1]);
							if (int > 12 || int < 1) return channel.say("Invalid date.");
							if (info[0] > 31 || info[0] < 1 || info[2] > 2012 || info[2] < 1958) return channel.say("Invalid date.");
							channel.say(`Your birthday has been set to: ${info.join('-')}`);
							profile.birthday = info.join('-');
						break;
						case 'nickname':
						case 'nick':
							channel.say(`Your nickname has been set to: ${info}`);
							profile.nickname = info;
						break;
						default:
							channel.say(`Invalid item: ${item}.`);
							channel.say(`Valid items: ${validItems.join(', ')}`);
						break;
					}
					Db('profiles').set(user.id, profile);
				break;
				}
				default:
					channel.say("Invalid command.");
					channel.say(`Valid commands: ${validCmds.join(', ')}`);
				break;
			}
		}
	},
	transfer: {
		server: true,
		usage: ['.transfer @user [amount]'],
		desc: 'Transfers the user amount of money given.',
		execute(target, channel, user, server, client) {
			target = parseInt(target.split(/ +/)[1]);
			if (isNaN(target)) return channel.say("Invalid amount.");
			const to = client.mentions.users.first();
			if (!to) return channel.say("You need to mention a user.");
			const userProf = Db('profiles').get(user.id, {});
			const toProf = Db('profiles').get(to.id, {});
			if (userProf.balance < target) return channel.say("You don't have that much amount of money to transfer.");
			userProf.balance -= target;
			toProf.balance += target;
			channel.say(`Transfered $${target} to ${to.username}`);
			Db('profiles').set(user.id, userProf);
			Db('profiles').set(to.id, toProf);
		}
	},
	givebucks: {
		server: true,
		usage: ['.give @user [amount]'],
		mod: true,
		desc: 'Gives the mentioned user the amount of bucks specified.',
		execute(target, channel, user, server, client) {
			target = parseInt(target.split(/ +/)[1]);
			if (isNaN(target)) return channel.say("Invalid amount.");
			const to = client.mentions.users.first();
			if (!to) return channel.say("You need to mention a user.");
			if (!Db('profiles').has(to.id)) Db('profiles').set(to.id, {});
			const toProf = Db('profiles').get(to.id, {});
			toProf.balance += target;
			channel.say(`Gave $${target} to ${to.username}.`)
			Db('profiles').set(to.id, toProf);
		}
	}
};
exports.commands = commands;
