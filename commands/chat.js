'use strict';

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
