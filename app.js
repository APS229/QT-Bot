'use strict';

global.Tools = require('./classes/tools.js');

global.Client = require('./classes/client.js');

global.Events = require('./classes/events.js');

global.Config = require('./config.js');

global.Request = require('request');

const PG = require('pg').Client;

global.Database = new PG({
    user: "postgres",
    connectionString: process.env.DATABASE_URL
});

Database.connect();

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
const util = require('util');
Client.connect();
