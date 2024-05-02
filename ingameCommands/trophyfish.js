const config = require('../config.json');
const { getPlayer, numberformatter } = require('../helper/functions.js');

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

        if (!searchedPlayer?.memberData?.trophy_fish) return;
        trophyFish = searchedPlayer.memberData.trophy_fish;

        const highestTiers = {};
        for (const key in trophyFish) {
            if (!key.match('.+(?=_(bronze|silver|gold|diamond))')) continue;
            const fishType = key.replace(/_(bronze|silver|gold|diamond)/, '');
            const fishTier = key.match(/(bronze|silver|gold|diamond)/)[0];
            if (!highestTiers[fishType] || compareTiers(highestTiers[fishType], fishTier)) {
                highestTiers[fishType] = fishTier;
            }
        }

        const tierToValue = {
            bronze: 1,
            silver: 2,
            gold: 3,
            diamond: 4
        };
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

        let statsMessage = `Total: ${numberformatter(trophyFish.total_caught, 1)} Tiers: `;
        for (const key in highestTiers) {
            const fishType = fishTypeToMessage[key] 
            const tier = tierToValue[highestTiers[key]];

            statsMessage += `,${fishType}:${tier} `;
        }
        statsMessage = `/gc @${messageAuthor}${messageAuthor === username ? "'s" : ` ${username}'s`} trophy fish stats: ${statsMessage}`

        if (statsMessage.length > 256) {
            statsMessage = statsMessage.substring(0, 256);
        }
        minecraftClient.chat(statsMessage);
    },
};

compareTiers = (tier1, tier2) => {
    const tierOrder = ['bronze', 'silver', 'gold', 'diamond'];
    return tierOrder.indexOf(tier1) < tierOrder.indexOf(tier2);
}
