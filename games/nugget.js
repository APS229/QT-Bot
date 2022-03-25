'use strict';

class Nugget {
    constructor(nuggBy, channel, client) {
        this.name = 'Nugget';
        this.before = nuggBy;
        this.user = client.mentions.users.first();
        this.channel = channel;
        this.client = client;
        channel.say(`The nugget has been handed to <@${this.user.id}>! Pass it before it explodes.`);
        setTimeout(() => {
            channel.say(`**BOOOOM**! The nugget exploded on ${this.user.username}.`);
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
