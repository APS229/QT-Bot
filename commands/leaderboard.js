'use strict'

const commands = {
  leaderboard: {
    desc: "Displays the leaderboard of rebel hunting screenshots.",
    usage: ['.leaderboard'],
    aliases: ['top', 'lb'],
    async execute(target, channel, user, server, client) {
      const playerObject = Db('rebel-kills-count').object();
      const rebelsCount = [];
      const leaderboard = new Map();
      let arg;
      if (Tools.toId(target) === 'day' || Tools.toId(target) === 'daily') {
        arg = 'daily';
      }
      else if (Tools.toId(target) === 'week' || Tools.toId(target) === 'weekly') {
        arg = 'weekly';
      }
      else arg = 'count';
      for (const player in playerObject) {
        if (playerObject[player][arg] > 0) rebelsCount.push(playerObject[player][arg]);
      }
      rebelsCount.sort((a, b) => b - a);
      let pCount = 0;
      let pID = null;
      for (const count of rebelsCount) {
        for (const player in playerObject) {
          if (count === playerObject[player][arg] && !leaderboard.has(player)) {
            pCount = playerObject[player][arg];
            pID = player;
            break;
          }
        }
        leaderboard.set(pID, pCount);
      }

      const embed = new Client.discord.MessageEmbed()
      .setTitle(`Top${arg === 'count' ? '' : ' ' + Tools.toTitleCase(arg)} Rebel Hunters`);
      let i = 1;
      for (const player of leaderboard) {
        if (i > 10) break;
        let playerMember;
        try {
          playerMember = await server.members.fetch(player[0]);
        }
        catch (err) {
          leaderboard.delete(player[0]);
          continue;
        }
        embed.addField('#' + i, `${playerMember.displayName}: ${player[1]}`);
        i++;
      }
      if (!leaderboard.size) {
        embed.setDescription("None");
      }
      channel.send({embeds: [embed]});
    }
  }
}
exports.commands = commands;
