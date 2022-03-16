'use strict';

class Nugget {
	constructor(eggedBY, channel, client) {
		this.name = 'Nugget';
		this.before = null;
		this.user = client.mentions.users.first();
        if (this.user.bot) {
            this.channel.say("You can't nugget a bot bruh.");
            return delete channel.game;
        }
		this.channel = channel;
		this.client = client;
		channel.say(`The nugget has been handed to <@${this.user.id}>! Pass it before it explodes.`);
		setTimeout(() => {
			channel.say(`**BOOOOM**! The nugget exploded on ${this.user.username}.`);
			if (this.before) {
				const profile = Db('profiles').get(this.before.id, {});
				if (!profile.nickname) profile.nickname = 'Not set.';
				if (!profile.birthday) profile.birthday = 'Not set';
				if (isNaN(profile.balance)) profile.balance = 0;
				profile.balance += 25;
				if (!profile.items) profile.items = [];
				Db('profiles').set(this.before.id, profile);
			}
            Client.commands.get('nugget').cooldown = Date.now();
			delete channel.game;
		}, Math.random() * 10000 + 8000);
	}
	pass(client) {
        if (this.user.id !== client.author.id) return;
		const user = client.mentions.users.first();
		if (!user) return;
        if (user.bot) return this.channel.say("You can't pass to a bot bruh.");
		this.before = this.user;
		this.user = user;
	}
}
exports.game = Nugget;
exports.id = 'nugget';
