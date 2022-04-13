'use strict';

global.Tools = require('./classes/tools.js');

global.Client = require('./classes/client.js');

global.Events = require('./classes/events.js');

global.Config = require('./config.js');

global.Request = require('request');

const PG = require('pg').Client;

global.Database = new PG({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    }
});

Database.connect();
Database.on('error', err => {
    console.log(err);
});

global.info = text => {
    if (typeof text !== 'string') return false;
    return console.log('Info: '.green + new Date() + ' ' + text);
};

Array.prototype.random = function () {
    return this[Math.floor((Math.random() * this.length))];
};
Array.prototype.times = function (element) {
    return this.filter(e => e == element).length;
};
Array.prototype.shuffle = function () {
    let currentIndex = this.length, randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [this[currentIndex], this[randomIndex]] = [
            this[randomIndex], this[currentIndex]];
    }
}

process.on('uncaughtException', error => {
    console.log(error);
});

try {
    require('colors');
    require.resolve('youtube-api');
}
catch (e) {
    console.log("Dependencies are not installed, run `npm install` to install.");
    process.exit();
}
if (!Config.token || !Config.cmdchar) {
    console.log("You need to fill out the config.js file.");
    process.exit(-1);
}
Client.connect();