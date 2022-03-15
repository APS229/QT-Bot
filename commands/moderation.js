'use strict';

const validColors = [
    'DEFAULT',
    'AQUA',
    'GREEN',
    'BLUE',
    'PURPLE',
    'LUMINOUS_VIVID_PINK',
    'GOLD',
    'ORANGE',
    'RED',
    'GREY',
    'DARKER_GREY',
    'NAVY',
    'DARK_AQUA',
    'DARK_GREEN',
    'DARK_BLUE',
    'DARK_PURPLE',
    'DARK_VIVID_PINK',
    'DARK_GOLD',
    'DARK_ORANGE',
    'DARK_RED',
    'DARK_GREY',
    'LIGHT_GREY',
    'DARK_NAVY',
    'RANDOM',
];

const commands = {
    createemoji: {
        mod: true,
        target: true,
        usage: ['.createemoji [emoji link], [name]'],
        desc: 'Creates a new emoji with the given information.',
        aliases: ['addemoji'],
        async execute(target, channel, user, server, client) {
            target = target.split(',').map(t => t.trim());
            if (target.length !== 2) return channel.say(`Usage: ${this.usage.join(' | ')}`);
            let emoji;
            try {
                emoji = await server.createEmoji(target[0], target[1]);
            }
            catch (e) {
                return channel.say("Invalid emoji image URL.");
            }
            channel.say("Created emoji:");
            channel.say(emoji.url);
        }
    },
    createchannel: {
        mod: true,
        target: true,
        usage: ['.createchannel [name]', '.createchannel [name], [type]'],
        desc: 'Creates a channel with the given information.',
        async execute(target, channel, user, server, client) {
            target = target.split(',');
            if (target[1]) {
                target[1] = Tools.toId(target[1]);
                if (target[1] !== 'text' && target[1] !== 'voice' && target[1] !== 'category') return channel.say("Invalid category specified.");
            }
            const ch = await server.channels.create(target[0]);
            channel.say(`Created ${target[1] ? target[1] : 'text'} channel: ${ch.name}`);
            const mutedRole = server.roles.cache.find('name', 'Muted');
            ch.overwritePermissions(mutedRole, { 'SEND_MESSAGES': false });
        }
    },
    createrole: {
        mod: true,
        target: true,
        usage: ['.createrole [name]', '.createrole [name], [color hexcode]'],
        desc: 'Creates a new role with the given information.',
        async execute(target, channel, user, server, client) {
            target = target.split(',').map(t => t.trim());
            let con;
            if (target[1]) {
                target[1] = target[1].toUpperCase();
                con = validColors.includes(target[1]);
                if (!(target[1].startsWith('#') || target[1].length === 7) && !con) return channel.say("The specified color should be in hex value or in list of valid colors. (Use .validcolors to see the list)");
            }
            const role = await server.roles.create({ data: { name: target[0], color: target[1] ? target[1] : null } }).catch(err => console.log(err));
            channel.say(`Created role: ${role.name} ${target[1] ? 'with color ' + role.hexColor.toUpperCase() : ''}`);
        }
    },
    // assignrole: {
    //   mod: true,
    //   target: true,
    //   usage: ['.assignrole [user], [role]'],
    //   aliases: ['setrole'],
    //   desc: 'Assigns the given role to the specified user.',
    //   async execute(target, channel, user, server, client) {
    //     target = target.split(',').map(t => t.trim());
    //     const targetUser = await client.mentions.users.first();
    //     if (!targetUser) return channel.say("You must specify a user by mentioning them.");
    //     if (!target[1]) return channel.say("You must specify a role.");
    //     const role = server.roles.cache.find(r => r.name === target[1]);
    //     if (!role) return channel.say("Role not found.");
    //     const roleCheck = targetUser.lastMessage.member.roles.cache.find(r => r.id === role.id);
    //     if (roleCheck) return channel.say(`<@${targetUser.id}> already has the role '${role.name}'`);
    //     await targetUser.lastMessage.member.addRole(role); // TODO: change this to get member from server's members' list
    //     channel.say(`'${role.name}' role was assigned to <@${targetUser.id}>.`);
    //   }
    // },
    removeemoji: {
        aliases: ['deleteemoji'],
        mod: true,
        target: true,
        desc: 'Removes the given emoji from the server.',
        execute(target, channel, user, server, client) {
            target = target.trim();
            const emoji = server.emojis.find(e => e.name === target);
            if (!emoji) return channel.say(`${target} emoji not found.`);
            server.deleteEmoji(emoji);
            channel.say(`The emoji ${target} has been deleted.`);
        }
    },
    removerole: {
        aliases: ['deleterole'],
        mod: true,
        target: true,
        desc: 'Removes the specified role from the server.',
        execute(target, channel, user, server, client) {
            if (target === 'Moderator') return channel.say(`You can't delete the ${target} role.`);
            const role = server.roles.find('name', target);
            if (!role) return channel.say("Role not found.");
            channel.say(`The role ${role.name} has been deleted.`);
            role.delete();
        }
    },
    removechannel: {
        aliases: ['deletechannel'],
        mod: true,
        target: true,
        usage: ['.removechannel [name], [type]'],
        desc: 'Removes the specified channel from the server.',
        async execute(target, channel, user, server, client) {
            target = target.split(',').map(t => t.trim());
            if (!target[1]) target[1] = 'text';
            Tools.toId(target[1]);
            const ch = server.channels.find('name', target[0]);
            if (!ch || ch.type !== target[1]) return channel.say("Channel not found.");
            channel.say(`The ${ch.type} channel ${ch.name} has been deleted.`);
            ch.delete();
        }
    },
    mute: {
        mod: true,
        target: true,
        usage: ['.mute @user', '.mute @user, [minutes]'],
        desc: 'Mutes the specified user for given minutes.',
        execute(target, channel, user, server, client) {
            target = target.split(',');
            const punished = client.mentions.users.first();
            if (!punished) return channel.say("You must specify a user by mentioning them.");
            let time = 5;
            if (target[1]) time = parseInt(target[1]);
            if (isNaN(time) || time < 1) return channel.say("Invalid time.");
            const member = server.members.get(punished.id);
            const role = server.roles.find('name', 'Muted');
            member.addRole(role);
            channel.say(`${punished.username} was muted for ${time} minutes.`);
            setTimeout(() => {
                member.removeRole(role);
            }, time * 1000 * 60);
        }
    },
    unmute: {
        mod: true,
        target: true,
        usage: ['.unmute @user'],
        desc: 'Unmutes the specified user.',
        execute(target, channel, user, server, client) {
            const punished = client.mentions.users.first();
            if (!punished) return channel.say("You must specify a user by mentioning them.");
            const member = server.members.get(punished.id);
            const role = member.roles.find('name', 'Muted');
            if (!role) return channel.say(`${punished.username} is not muted.`);
            member.removeRole(role);
            channel.say(`${punished.username} was unmuted.`);
        }
    },
    ban: {
        supermod: true,
        target: true,
        usage: ['.ban @user, [reason]'],
        desc: 'Bans the specified user from server.',
        execute(target, channel, user, server, client) {
            target = target.split(',');
            const targetUser = client.mentions.users.first();
            if (!targetUser) return channel.say("You must specify a user by mentioning them.");
            if (!target[1]) return channel.say("You must specify a reason for banning this user.");
            server.ban(targetUser, target[1]);
            channel.say(`Successfully banned the user: <@${targetUser.id}>`);
        }
    },
    leaveserver: {
        usage: ['.leaveserver'],
        desc: 'Makes the bot leave the current server.',
        execute(target, channel, user, server, client) {
            if (!user.owner && !user.isDev()) return;
            server.leave();
        }
    },
    createinvite: {
        usage: ['.createinvite', '.createinvite [time in minutes]', '.createinvite [time in minutes], [uses]'],
        mod: true,
        desc: 'Creates a new invitation to the server with given information.',
        async execute(target, channel, user, server, client) {
            let invite;
            if (!target) {
                invite = await channel.createInvite();
            }
            else {
                target = target.split(',');
                if (target[1]) {
                    const uses = parseInt(target[1]);
                    const time = Math.floor(parseInt(target[0]) * 60);
                    if (!uses || !time) return channel.say("Invalid time or number of uses.");
                    invite = await channel.createInvite({ maxAge: time, maxUses: uses });
                }
                else {
                    const time = Math.floor(parseInt(target[0]) * 60);
                    if (!time) return channel.say("Invalid time.");
                    invite = await channel.createInvite({ maxAge: time });
                }
            }
            channel.say(`https://discord.gg/${invite.code}`);
        }
    }
};
exports.commands = commands;
/*globals Tools*/
