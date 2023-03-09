const config = require('../config.json');
const { getPlayer } = require('../helper/functions.js');

module.exports = {
    name: 'level',
    description: 'Get a player\'s skyblock level.',
    args: '[ign] [profile]',
    execute: async (discordClient, message, messageAuthor) => {
        if (config.ingameCommands.skills) {
            let { 1: username, 2: profile } = message.split(' ');

            if (!username) username = messageAuthor;

            const searchedPlayer = await getPlayer(username, profile).catch((err) => {
                return minecraftClient.chat(`/gc @${messageAuthor} ${err}`);
            });

            const playerProfile = searchedPlayer.memberData;
            if (!playerProfile || !playerProfile.leveling || !playerProfile.leveling.experience) {
                return minecraftClient.chat(`/gc @${messageAuthor}${messageAuthor === username ? "'s" : ` ${username}'s`} skyblock level was unable to be fetched.`);
            }

            minecraftClient.chat(`/gc @${messageAuthor}${messageAuthor === username ? "'s" : ` ${username}'s`} skyblock level is ${parseFloat(playerProfile.leveling.experience / 100).toFixed(2)}.`);
        }
    },
};
