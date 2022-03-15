'use strict';

/**
 * A bot that welcomes new guild members when they join
 */

// Import the discord.js module
const Discord = require('discord.js');

// Create an instance of a Discord client
const client = new Discord.Client();

/**
 * The ready event is vital, it means that only _after_ this will your bot start reacting to information
 * received from Discord
 */
client.on('ready', () => {
  console.log('I am ready!');
});

// Create an event listener for new guild members
client.on('guildMemberAdd', member => {
  console.log('h');
});

// Log our bot in using the token from https://discord.com/developers/applications
client.login('NDQxNTc2MzM1MTY1NjIwMjI0.WusAAg.Ao66mHOBXFd89xDozOuLDleDqyo');
