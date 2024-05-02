const config = require('../config.json');
const { getPlayer, numberformatter } = require('../helper/functions.js');

const tierToValue = {
	bronze: 1,
	silver: 2,
	gold: 3,
	diamond: 4
};

const tierToName = {
	bronze: 'B',
	silver: 'S',
	gold: 'G',
	diamond: 'D'
}

const fishTypeToMessage = {
	slugfish: 'Slug',
	blobfish: 'Blob',
	golden_fish: 'Golden',
	vanille: 'Vanille',
	sulphur_skitter: 'Skitter',
	lava_horse: 'Lava',
	gusher: 'Gusher',
	obfuscated_fish_1: 'Obf1',
	obfuscated_fish_2: 'Obf2',
	obfuscated_fish_3: 'Obf3',
	volcanic_stonefish: 'Stone',
	mana_ray: 'Mana',
	steaming_hot_flounder: 'Flounder',
	flyfish: 'Fly',
	moldfin: 'Mold',
	skeleton_fish: 'Skele',
	soul_fish: 'Soul',
	karate_fish: 'Karate',
};

const compareTiers = (tier1, tier2) => {
    const tierOrder = ['bronze', 'silver', 'gold', 'diamond'];
    return tierOrder.indexOf(tier1) < tierOrder.indexOf(tier2);
}

module.exports = {
    name: 'trophyfish',
    description: 'Get a player\'s trophy fish stats.',
    args: '[ign] [profile]',
    execute: async (discordClient, message, messageAuthor) => {
        let { 1: username, 2: profile } = message.split(' ');
        if (!username) username = messageAuthor;

        const searchedPlayer = await getPlayer(username, profile).catch((err) => {
            return minecraftClient.chat(`/gc @${messageAuthor} ${err}`);
        });

		const trophyFish = searchedPlayer?.memberData?.trophy_fish;
        if (!trophyFish) return minecraftClient.chat(`/gc @${messageAuthor} Player does not have any trophy fish data.`);;
        
        const highestTiers = {};
        for (const key in trophyFish) {
            if (!key.match('.+(?=_(bronze|silver|gold|diamond))')) continue;
			if (!key.match('.+(?=_(bronze|silver|gold|diamond))')) return null;
            const fishType = key.replace(/_(bronze|silver|gold|diamond)/, '');
            const fishTier = key.match(/(bronze|silver|gold|diamond)/)[0];
            if (!highestTiers[fishType] || compareTiers(highestTiers[fishType], fishTier)) {
                highestTiers[fishType] = fishTier;
            }
		};

		if (!Object.keys(highestTiers).length) return minecraftClient.chat(`/gc @${messageAuthor} ${username} has not caught any trophy fish.`);

        minecraftClient.chat(`/gc @${messageAuthor}${messageAuthor === username ? "'s" : ` ${username}'s`} total trophy fish caught: ${numberformatter(trophyFish.total_caught, 1)} | ${Object.keys(highestTiers).sort((a, b) => tierToValue[highestTiers[b]] - tierToValue[highestTiers[a]]).map(t => fishTypeToMessage[t] + ": " + tierToName[highestTiers[t]]).join(', ')}`.substring(0, 256));
    },
};

