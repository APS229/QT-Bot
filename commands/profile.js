'use strict';

const commands = {
    profile: {
        usage: ['.profile'],
        aliases: ['prof'],
        devOnly: true,
        hidden: true,
        execute(target, channel, user, server, client) {
            Database.query(`select * from profile where id='${user.id}'`, (err, res) => {
                if (err) return console.log(err);
                console.log(res);
            });
        }
    }
};

exports.commands = commands;