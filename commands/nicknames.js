'use strict';

const commands = {
    nickname: {
        server: true,
        usage: ['.nickname [name]'],
        aliases: ['nick'],
        async execute(target, channel, user, server, client) {
            if (target.length > 32) return channel.say('Nickname too long.');
            if (target.length < 3) return channel.say('Nickname too short.');
            if (/[^a-zA-Z0-9]/g.test(target.substring(0, 3))) return channel.say("You can't use that nickname.");
            const currentName = server.members.cache.find(m => m.user.username === user.username)?.nickname ?
                server.members.cache.find(m => m.user.username === user.username).nickname : user.username;
            if (currentName === target) return channel.say(`Your current nickname is already ${currentName}.`);
            const requestChannel = server.channels.cache.find(ch => ch.name === 'nickname-requests');
            const embed = new Client.discord.MessageEmbed()
                .setAuthor(user.username, user.avatarURL())
                .setTitle('Nickname requested')
                .setDescription(`\`\`${currentName}\`\` => \`\`${target}\`\``)
                .setTimestamp()
                .setFooter({ text: user.id });
            const message = await requestChannel.send({ embeds: [embed] });
            message.react('✅');
            message.react('❌');
            Client.nicknames.set(message.id, {user: user.id, nick: target});
            channel.say("Nickname request submitted: ``" + target + "``");
        }
    }
};

exports.commands = commands;