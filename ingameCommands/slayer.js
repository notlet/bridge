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

	    if (!searchedPlayer?.memberData?.slayer_bosses) return;
        const memberData = searchedPlayer.memberData;

        const total = (memberData?.slayer_bosses?.zombie?.xp || 0) + (memberData?.slayer_bosses?.spider?.xp || 0) + (memberData?.slayer_bosses?.wolf?.xp || 0) + (memberData?.slayer_bosses?.enderman?.xp || 0) + (memberData?.slayer_bosses?.blaze?.xp || 0);
        const slayers = {
            "rev": getSkillLevel(memberData?.slayer_bosses?.zombie?.xp || 0, { skill: 'slayer', totalExp: true }).fancy,
            "tara": getSkillLevel(memberData?.slayer_bosses?.spider?.xp || 0, { skill: 'slayer', totalExp: true }).fancy,
            "wolf": getSkillLevel(memberData?.slayer_bosses?.wolf?.xp || 0, { skill: 'slayer', totalExp: true }).fancy,
            "eman": getSkillLevel(memberData?.slayer_bosses?.enderman?.xp || 0, { skill: 'slayer', totalExp: true }).fancy,
            "blaze": getSkillLevel(memberData?.slayer_bosses?.blaze?.xp || 0, { skill: 'slayer', totalExp: true }).fancy,
            "vampire": getSkillLevel(memberData?.slayer_bosses?.vampire?.xp || 0, { skill: 'slayer_vampire', totalExp: true }).fancy
        }

        minecraftClient.chat(`/gc @${messageAuthor}${messageAuthor === username ? "" : ` ${username}`} has ${numberformatter(total, 2)} total slayer exp. | Zombie: ${slayers.rev} | Spider: ${slayers.tara} | Wolf: ${slayers.wolf} | Eman: ${slayers.eman} | Blaze: ${slayers.blaze} | Vampire: ${slayers.vampire}`);
    },
};
