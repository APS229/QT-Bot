'use strict';

const commands = {
    profile: {
        usage: ['.profile'],
        aliases: ['prof'],
        execute(target, channel, user, server, client) {
            Database.query(`select * from profile where id='${user.id}'`).then(res => {
                if (res.rows.length) channel.say(`Your level: ${res.rows[0].level}\nYour XP: ${res.rows[0].xp}\nYour balance: ${res.rows[0].balance}`);
            });
        }
    }
};

exports.commands = commands;