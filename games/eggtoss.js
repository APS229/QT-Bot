'use strict';

class Eggtoss {
	// Mini Egg Toss
	constructor(eggedBY, channel, client) {
		this.name = 'Egg Toss';
		this.before = null;
		this.user = client.mentions.users.first();
		if (!client.mentions.users.first()) {
			channel.say("You need to specify a user.");
			delete channel.game;
		}
		this.channel = channel;
		this.client = client;
		channel.say(`The egg has been handed to <@${this.user.id}>! Pass it before it explodes.`);
		setTimeout(() => {
			channel.say(`**BOOOOM**! The egg exploded on ${this.user.username}.`);
			if (this.before) {
				const profile = Db('profiles').get(this.before.id, {});
				if (!profile.nickname) profile.nickname = 'Not set.';
				if (!profile.birthday) profile.birthday = 'Not set';
				if (isNaN(profile.balance)) profile.balance = 0;
				profile.balance += 25;
				if (!profile.items) profile.items = [];
				Db('profiles').set(this.before.id, profile);
			}
			delete channel.game;
		}, Math.random() * 10000 + 8000);
	}
	pass(client) {
		const user = client.mentions.users.first();
		if (!user) return;
		this.before = this.user;
		this.user = user;
	}
}
exports.game = Eggtoss;
exports.id = 'eggtoss';
