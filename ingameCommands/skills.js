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

            const searchedPlayer = await getPlayer(username, profile).catch((err) => {
                return minecraftClient.chat(`/gc @${messageAuthor} ${err}`);
            });
            if (!searchedPlayer) return;
            const playerProfile = searchedPlayer.memberData;

            const skills = getSkillAverage(playerProfile, 2);

            if (skills == 0) {
                return minecraftClient.chat(`/gc @${messageAuthor}${messageAuthor === username ? "'s" : ` ${username}'s`} skills API is disabled.`);
            }

            const skillsMap = ["Farming", "Mining", "Combat", "Foraging", "Fishing", "Enchanting", "Alchemy", "Taming", "Carpentry"];
            const part = `@${messageAuthor}${messageAuthor === username ? "'s" : ` ${username}'s`} SA is ${skills.average}. | `; 
            
            const out = short => part + skillsMap.map((s, i) => `${short ? s.substring(0, 2) : s}: ${skills.levels[i].fancy}`).join(' | ')
    
            minecraftClient.chat(`/gc ${out().length < 256 ? out() : out(true)}`);
        }
    },
};
