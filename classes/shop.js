'use strict';

class Shop {
	constructor(user, channel) {
		this.shop = require('../database/shop.json');
		this.user = user;
		this.channel = channel;
		this.items = Object.keys(this.shop);
		this.itemLen = this.items.length;
		this.maxPages = 2;
		this.embed = null;
	}
	createPage(num) {
		this.embed = new Client.discord.MessageEmbed()
		.setAuthor('Shop', Config.avatarURL)
		.setDescription(`**Info:** Use message reactions to switch between pages\n**Total pages:** ${this.maxPages}`)
		.setTimestamp()
		.setFooter(`Requested by ${this.user.username}`, this.user.avatarURL);
		if (this.itemLen % 2 === 0) {
			if (num === 1) {
				for (let i = 0; i < this.itemLen / 2; i++) {
					const item = this.shop[this.items[i]];
					this.embed.addField(`${item.emoji} ${item.name}`, `**Cost Price:** $${item.cost}\n**Selling Price:** $${item.sell}`);
				}
			}
			else if (num === 2) {
				for (let i = this.itemLen / 2; i < this.itemLen; i++) {
					const item = this.shop[this.items[i]];
					this.embed.addField(`${item.emoji} ${item.name}`, `**Cost Price:** $${item.cost}\n**Selling Price:** $${item.sell}`);
				}
			}
		}
		else {
			if (num === 1) {
				const len = ((this.itemLen - 1) / 2) + 1;
				for (let i = 0; i < len; i++) {
					const item = this.shop[this.items[i]];
					this.embed.addField(`${item.emoji} ${item.name}`, `**Cost Price:** $${item.cost}\n**Selling Price:** $${item.sell}`);
				}
			}
			else if (num === 2) {
				const len = ((this.itemLen - 1) / 2) + 1;
				for (let i = len; i < this.itemLen; i++) {
					const item = this.shop[this.items[i]];
					this.embed.addField(`${item.emoji} ${item.name}`, `**Cost Price:** $${item.cost}\n**Selling Price:** $${item.sell}`);
				}
			}
		}
	}
	async showDefaultPage() {
		this.createPage(1);
		const embed = this.embed;
		const msg = await this.channel.send({embeds: [embed]});
		msg.react(emote.left);
		setTimeout(() => msg.react(emote.right), 300); // To prevent reacting right first
		this.lastMessage = msg;
		this.posted = true;
	}
	change(page) {
		this.createPage(page);
		const embed = this.embed;
		this.lastMessage.edit({embed});
	}
}
module.exports = Shop;
