'use strict';

global.GameEndedError = class extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
};

global.Tools = require('./classes/tools.js');

global.Client = require('./classes/client.js');

global.Events = require('./classes/events.js');

global.Database = require('./classes/database.js');

global.Config = require('./config/config.js');

global.Games = require('./games/games.js');

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
    const array = this;
    let currentIndex = this.length, randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}

process.on('uncaughtException', error => {
    console.error(error);
});

process.on('unhandledRejection', reason => {
    console.error(reason);
});

try {
    require('colors');
}
catch (e) {
    console.log("Dependencies are not installed, run `npm install` to install.");
    process.exit();
}
if (!Config.token) {
    console.log("You need to fill out the config.js file.");
    process.exit(-1);
}
Client.connect();