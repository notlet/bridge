const config = require('../config.json');
const { getPlayer, numberformatter } = require('../helper/functions.js');
const { getSkillLevel } = require('../helper/skills');

module.exports = {
    name: 'cata',
    description: 'Get a player\'s dungeons stats.',
    args: '[ign] [profile]',
    execute: async (discordClient, message, messageAuthor) => {
        let { 1: username, 2: profile } = message.split(' ');

        if (!username) username = messageAuthor;

	//const searchedPlayer = {memberData: require('../apitest.json').profiles[3].members["f164eb183b9943449ae10b2dcf9c9ff7"]};

        const searchedPlayer = await getPlayer(username, profile, true).catch((err) => {
            return minecraftClient.chat(`/gc @${messageAuthor} ${err}`);
        });
	    if (!searchedPlayer?.memberData?.dungeons) return;
        const dungeons = searchedPlayer.memberData.dungeons

        const cataLvl = getSkillLevel(dungeons.dungeon_types.catacombs.experience, {decimals: 2, skill: "dungeoneering"}).fancy;
        const classes = {
            "healer": getSkillLevel(dungeons.player_classes.healer.experience, {decimals: 0, skill: "dungeonClass"}).level,
            "mage": getSkillLevel(dungeons.player_classes.mage.experience, {decimals: 0, skill: "dungeonClass"}).level,
            "berserk": getSkillLevel(dungeons.player_classes.berserk.experience, {decimals: 0, skill: "dungeonClass"}).level,
            "archer": getSkillLevel(dungeons.player_classes.archer.experience, {decimals: 0, skill: "dungeonClass"}).level,
            "tank": getSkillLevel(dungeons.player_classes.tank.experience, {decimals: 0, skill: "dungeonClass"}).level
        }

        const currClass = dungeons.selected_dungeon_class;
        const currClassFancy = currClass[0].toUpperCase() + currClass.substring(1);

	const secrets = searchedPlayer.playerData ? numberformatter(searchedPlayer.playerData.achievements.skyblock_treasure_hunter, 2) : "<API ERROR>";
	//const secrets = 69
        minecraftClient.chat(`/gc @${messageAuthor}${messageAuthor === username ? "'s" : ` ${username}'s`} catacombs level is ${cataLvl} | Selected Class - ${currClassFancy} ${classes[currClass]} | Class Levels: T${classes.tank}, A${classes.archer}, B${classes.berserk}, M${classes.mage}, H${classes.healer} | Total Secrets found: ${secrets}`);
    },
};
