'use strict';

const commands = {
	shop: {
		desc: 'Shop to buy and sell your products!',
		aliases: ['market'],
		usage: ['.shop', '.shop buy [item]', '.shop sell [item]'],
		server: true,
		execute(target, channel, user, server, client) {
			Client.shop = new Shop(user, channel);
			if (!target) {
				if (!Object.keys(Client.shop.shop).length) return channel.say("There are currently no items in shop.");
				Client.shop.showDefaultPage();
				return;
			}
			let [cmd, item, ...rest] = target.split(/ +/).map(t => t.trim());
			item = Tools.toId(item);
			let quantity = 0;
			switch (Tools.toId(cmd)) {
				case 'buy':
					if (rest.length) {
						if (!(item || item in Client.shop.shop)) return channel.say("That's not a valid item.");
						quantity = parseInt(rest[0]);
						if (isNaN(quantity)) return channel.say("The quantity must be a number.");
					}
					if (item in Client.shop.shop) {
						item = Client.shop.shop[item];
						const profile = Db('profiles').get(user.id, {});
						const cost = quantity ? quantity * item.cost: item.cost;
						if (!profile.balance || profile.balance < cost) return channel.say("You don't have enough money to buy this item.");
						channel.say(`You have bought: ${quantity ? quantity + ' ' : ''}${item.emoji} ${item.name}${quantity ? 's' : ''}`);
						if (isNaN(profile.items[item.name])) profile.items[item.name] = 0;
						profile.items[item.name] += quantity ? quantity : 1;
						profile.balance -= cost;
						Db('profiles').set(user.id, profile);
						return;
					}
					channel.say(`${item} item doesn't exist in shop.`);
				break;
				case 'sell':
					if (rest.length) {
						if (!(item || item in Client.shop.shop)) return channel.say("That's not a valid item.");
						quantity = parseInt(rest[0]);
						if (isNaN(quantity)) return channel.say("The quantity must be a number.");
					}
					if (item in Client.shop.shop) {
						item = Client.shop.shop[item];
						const profile = Db('profiles').get(user.id, {});
						const revenue = quantity ? quantity * item.sell: item.sell;
						const items = Object.keys(profile.items);
						if (!items.length || !items.includes(item.name)) return channel.say("You don't have that item.");
						if (quantity > profile.items[item.name]) return channel.say(`You don't have that many ${item.name}s`);
						channel.say(`You have sold: ${quantity ? quantity + ' ' : ''}${item.emoji} ${item.name}${quantity ? 's' : ''}`);
						profile.items[item.name] -= quantity ? quantity : 1;
						if (profile.items[item.name] === 0) delete profile.items[item.name];
						profile.balance += revenue;
						return Db('profiles').set(user.id, profile);
					}
					channel.say(`${item} item doesn't exist in shop.`);
				break;
				default:
					channel.say("Invalid command!");
					channel.say(`Usage:\n\t${this.usage.join('\n\t')}`);
			}
		}
	}
};
exports.commands = commands;
/*globals Shop Client Tools Db*/
