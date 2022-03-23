'use strict';

const commands = {
    profile: {
        usage: ['.profile'],
        aliases: ['prof'],
        execute(target, channel, user, server, client) {
            // Database.query(`select * from profile where id='${user.id}'`, (err, res) => {
            //     if (err) return channel.say("No data found.");
            //     channel.say("APS level: " + res.rows[0].level);
            // });
        }
    }
};

exports.commands = commands;