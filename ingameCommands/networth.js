const { getNetworth } = require('skyhelper-networth');
const config = require('../config.json');
const { getPlayer, numberformatter } = require('../helper/functions.js');
const funnynetworth = require('../funnynetworth.js');

module.exports = {
    name: 'networth',
    description: 'Get a player\'s networth.',
    args: '[ign] [profile]',
    execute: async (discordClient, message, messageAuthor) => {
        if (config.ingameCommands.networth) {
            let { 1: username, 2: profile } = message.split(' ');

            if (!username) username = messageAuthor;

            const searchedPlayer = await getPlayer(username, profile).catch((err) => {
                return minecraftClient.chat(`/gc @${messageAuthor} ${err}`);
            });

            const networth = await getNetworth(searchedPlayer.memberData, searchedPlayer.profileData?.banking?.balance, { onlyNetworth: true });

            if (networth.noInventory) {
                return minecraftClient.chat(
                    `/gc @${messageAuthor}${messageAuthor === username ? "'s" : ` ${username}'s`} inventory API is disabled.`
                );
            }

            if (Object.keys(funnynetworth).includes(username.toLowerCase())) {
                return minecraftClient.chat(
                    `/gc @${messageAuthor}${messageAuthor === username ? "'s" : ` ${username}'s`} networth is ${funnynetworth[username.toLowerCase()](networth.networth.toFixed(), numberformatter)}.`
                );
            }

            minecraftClient.chat(
                `/gc @${messageAuthor}${messageAuthor === username ? "'s" : ` ${username}'s`} networth is ${numberformatter(
                    networth.networth.toFixed(),
                    3
                )}`
            );
        }
    },
};
