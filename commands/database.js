'use strict';

const commands = {
    settings: {
        modOnly: true,
        desc: "Configure the bot's settings for this server.",
        execute(interaction) {
            interaction.reply("*This command is still work-in-progress.*");
        }
    }
};

exports.commands = commands;