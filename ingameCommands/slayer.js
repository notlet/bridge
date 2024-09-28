const config = require('../config.json');
const { getPlayer, numberformatter } = require('../helper/functions.js');
const { getSkillLevel } = require('../helper/skills');

module.exports = {
    name: 'slayers',
    description: 'Get a player\'s slayer EXP and levels.',
    args: '[ign] [profile]',
    execute: async (discordClient, message, messageAuthor) => {
        let { 1: username, 2: profile } = message.split(' ');

        if (!username) username = messageAuthor;

        const searchedPlayer = await getPlayer(username, profile).catch((err) => minecraftClient.chat(`/gc @${messageAuthor} ${err}`));
        if (!searchedPlayer) return;
		username = searchedPlayer.username;

        const slayerdata = searchedPlayer?.memberData?.slayer?.slayer_bosses

	    if (!slayerdata) return minecraftClient.chat(`/gc @${messageAuthor} ${username} has no slayer data or something went wrong.`);
        const memberData = searchedPlayer.memberData;

        const total = (slayerdata.zombie?.xp || 0) + (slayerdata.spider?.xp || 0) + (slayerdata.wolf?.xp || 0) + (slayerdata.enderman?.xp || 0) + (slayerdata.blaze?.xp || 0);
        const slayers = {
            "rev": getSkillLevel(slayerdata.zombie?.xp || 0, { skill: 'slayer', totalExp: true }).fancy,
            "tara": getSkillLevel(slayerdata.spider?.xp || 0, { skill: 'slayer', totalExp: true }).fancy,
            "wolf": getSkillLevel(slayerdata.wolf?.xp || 0, { skill: 'slayer', totalExp: true }).fancy,
            "eman": getSkillLevel(slayerdata.enderman?.xp || 0, { skill: 'slayer', totalExp: true }).fancy,
            "blaze": getSkillLevel(slayerdata.blaze?.xp || 0, { skill: 'slayer', totalExp: true }).fancy,
            "vampire": getSkillLevel(slayerdata.vampire?.xp || 0, { skill: 'slayer_vampire', totalExp: true }).fancy
        }

        minecraftClient.chat(`/gc @${messageAuthor}${messageAuthor === username ? "" : ` ${username}`} has ${numberformatter(total, 2)} total slayer exp. | Zombie: ${slayers.rev} | Spider: ${slayers.tara} | Wolf: ${slayers.wolf} | Eman: ${slayers.eman} | Blaze: ${slayers.blaze} | Vampire: ${slayers.vampire}`);
    },
};
