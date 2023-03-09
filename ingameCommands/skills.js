const config = require('../config.json');
const { getPlayer } = require('../helper/functions.js');
const { getSkillAverage } = require('../helper/skills');

module.exports = {
    name: 'skills',
    description: 'Get a player\'s skills and skill average.',
    args: '[ign] [profile]',
    execute: async (discordClient, message, messageAuthor) => {
        if (config.ingameCommands.skills) {
            let { 1: username, 2: profile } = message.split(' ');

            if (!username) username = messageAuthor;

            //const searchedPlayer = {memberData: require('../apitest.json').profiles[3].members["f164eb183b9943449ae10b2dcf9c9ff7"]};

            const searchedPlayer = await getPlayer(username, profile).catch((err) => {
                return minecraftClient.chat(`/gc @${messageAuthor} ${err}`);
            });
            if (!searchedPlayer?.memberData) return;
            const playerProfile = searchedPlayer.memberData;

            const skills = getSkillAverage(playerProfile, 2);

            if (skills.average == 0) {
                return minecraftClient.chat(`/gc @${messageAuthor}${messageAuthor === username ? "'s" : ` ${username}'s`} skills API is disabled.`);
            }

            minecraftClient.chat(`/gc @${messageAuthor}${messageAuthor === username ? "'s" : ` ${username}'s`} skill average is ${skills.average}. | Farming: ${skills.levels[0].fancy} | Mining: ${skills.levels[1].fancy} | Combat: ${skills.levels[2].fancy} | Foraging: ${skills.levels[3].fancy} | Fishing: ${skills.levels[4].fancy} | Enchanting: ${skills.levels[5].fancy} | Alchemy: ${skills.levels[6].fancy} | Taming: ${skills.levels[7].fancy}`);
        }
    },
};

// const skills = ['farming', 'mining', 'combat', 'foraging', 'fishing', 'enchanting', 'alchemy', 'taming'];
