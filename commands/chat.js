'use strict';

const commands = {
    randomcat: {
        desc: "Shows a picture of a random cat.",
        async execute(interaction) {
            try {
                const response = await fetch('https://api.thecatapi.com/v1/images/search');
                const data = await response.json();
                const catURL = `${data[0].url}`;
                interaction.reply(catURL);
            }
            catch (e) {
                console.error(e);
            }
        }
    },
    randomdog: {
        desc: "Shows a picture of a random dog.",
        async execute(interaction) {
            try {
                const response = await fetch('https://dog.ceo/api/breeds/image/random');
                const data = await response.json();
                const dogURL = data.message;
                interaction.reply(dogURL);
            }
            catch (e) {
                console.error(e);
            }
        }
    }
};
exports.commands = commands;
