'use strict';

const OptionTypes = {
    STRING: 3,
    INTEGER: 4,
    BOOLEAN: 5,
    USER: 6,
    CHANNEL: 7,
    ROLE: 8,
    NUMBER: 10,
    ATTACHMENT: 11
};

const commands = {
    // pick: {
    //     options: [
    //         {
    //             type: "STRING",
    //             name: "choice1",
    //             description: "1st choice",
    //             required: true
    //         },
    //         {
    //             type: "STRING",
    //             name: "choice2",
    //             description: "2nd choice",
    //             required: true
    //         },
    //         {
    //             type: "STRING",
    //             name: "choice3",
    //             description: "3rd choice"
    //         },
    //         {
    //             type: "STRING",
    //             name: "choice4",
    //             description: "4th choice"
    //         }
    //     ],
    //     desc: 'Randomly picks a choice from the given choices.',
    //     execute(interaction) {
    //         target = interaction.options;
    //         interaction.reply(`Random pick: ${target.random()}`);
    //     }
    // },
    // roll: {
    //     desc: 'Rolls a random number between 1 to the given number.',
    //     execute(interaction) {
    //         if (target.match(/[^\d\sdHL+-]/i)) return;

    //         let maxDice = 40;

    //         let diceQuantity = 1;
    //         let diceDataStart = target.indexOf('d');
    //         if (diceDataStart >= 0) {
    //             if (diceDataStart) diceQuantity = Number(target.slice(0, diceDataStart));
    //             target = target.slice(diceDataStart + 1);
    //             if (!Number.isInteger(diceQuantity) || diceQuantity <= 0 || diceQuantity > maxDice) return interaction.reply(`The amount of dice rolled should be a natural number up to ${maxDice}.`);
    //         }
    //         let offset = 0;
    //         let removeOutlier = 0;

    //         let modifierData = target.match(/[+-]/);
    //         if (modifierData) {
    //             switch (target.slice(modifierData.index).trim().toLowerCase()) {
    //                 case '-l':
    //                     removeOutlier = -1;
    //                     break;
    //                 case '-h':
    //                     removeOutlier = +1;
    //                     break;
    //                 default:
    //                     offset = Number(target.slice(modifierData.index));
    //                     if (isNaN(offset)) return;
    //                     if (!Number.isSafeInteger(offset)) return interaction.reply(`The specified offset must be an integer up to ${Number.MAX_SAFE_INTEGER}.`);
    //             }
    //             if (removeOutlier && diceQuantity <= 1) return interaction.reply(`More than one dice should be rolled before removing outliers.`);
    //             target = target.slice(0, modifierData.index);
    //         }

    //         let diceFaces = 6;
    //         if (target.length) {
    //             diceFaces = Number(target);
    //             if (!Number.isSafeInteger(diceFaces) || diceFaces <= 0) {
    //                 return interaction.reply(`The dice must have a natural amount of faces up to ${Number.MAX_SAFE_INTEGER}.`);
    //             }
    //         }

    //         if (diceQuantity > 1) {
    //             if (!Number.isSafeInteger(offset < 0 ? diceQuantity * diceFaces : diceQuantity * diceFaces + offset)) {
    //                 return interaction.reply(`The maximum sum of the dice must be lower or equal than ${Number.MAX_SAFE_INTEGER}.`);
    //             }
    //         }

    //         let maxRoll = 0;
    //         let minRoll = Number.MAX_SAFE_INTEGER;

    //         let trackRolls = diceQuantity * (('' + diceFaces).length + 1) <= 60;
    //         let rolls = [];
    //         let rollSum = 0;

    //         for (let i = 0; i < diceQuantity; ++i) {
    //             let curRoll = Math.floor(Math.random() * diceFaces) + 1;
    //             rollSum += curRoll;
    //             if (curRoll > maxRoll) maxRoll = curRoll;
    //             if (curRoll < minRoll) minRoll = curRoll;
    //             if (trackRolls) rolls.push(curRoll);
    //         }

    //         if (removeOutlier > 0) {
    //             rollSum -= maxRoll;
    //         } else if (removeOutlier < 0) {
    //             rollSum -= minRoll;
    //         }
    //         if (offset) rollSum += offset;

    //         let offsetFragment = '';
    //         if (offset) offsetFragment += (offset > 0 ? ' + ' + offset : offset);

    //         if (diceQuantity === 1) return interaction.reply(`Rolling (1 to ${diceFaces})${offsetFragment}: ${rollSum}`);

    //         const outlierFragment = removeOutlier ? ` except ${removeOutlier > 0 ? 'highest' : 'lowest'}` : ``;
    //         const rollsFragment = trackRolls ? ": " + rolls.join(', ') : "";
    //         return interaction.reply(
    //             `${diceQuantity} rolls (1 to ${diceFaces})${rollsFragment}\n` +
    //             `Sum${offsetFragment}${outlierFragment}: ${rollSum}`
    //         );
    //     }
    // },
    randomcat: {
        desc: "Shows a picture of a random cat.",
        execute(interaction) {
            require('fetch').fetchUrl('https://api.thecatapi.com/v1/images/search', (error, response, body) => {
                if (error) return console.log("Error in command randomcat: " + error);
                const cat = `${JSON.parse(body)[0].url}`;
                interaction.reply({ files: [cat] });
            });
        }
    },
    randomdog: {
        desc: "Shows a picture of a random dog.",
        execute(interaction) {
            require('fetch').fetchUrl('https://dog.ceo/api/breeds/image/random', (error, response, body) => {
                if (error) return console.log("Error in command randomdog: " + error);
                const dog = `${JSON.parse(body).message}`;
                interaction.reply({ files: [dog] });
            });
        }
    },
    nickname: {
        options: [
            {
                type: OptionTypes.STRING,
                name: 'nick',
                description: "Nickname you want to change to.",
                required: true
            }
        ],
        desc: "Change your nickname.",
        async execute(interaction) {
            const target = interaction.options._hoistedOptions[0].value;
            if (target.length > 32) return interaction.reply({ content: "Nickname too long.", flags: 'Ephemeral' });
            if (target.length < 3) return interaction.reply({ content: "Nickname too short.", flags: 'Ephemeral' });
            if (/[^a-zA-Z0-9]/g.test(target.substring(0, 3))) return interaction.reply({ content: "You can't use that nickname because the first 3 characters are not alphanumeric.", flags: 'Ephemeral' });
            const currentName = interaction.member.displayName;
            if (currentName === target) return interaction.reply({ content: `Your current nickname is already ${currentName}.`, flags: 'Ephemeral' });
            try {
                await interaction.member.setNickname(target);
                interaction.reply({ content: `Nickname successfully changed to: ${target}`, flags: 'Ephemeral' });
            }
            catch (err) {
                interaction.reply({ content: "Missing permissions to change your nickname.", flags: 'Ephemeral' });
            }
        }
    }
};
exports.commands = commands;
