const config = require('../config.json');
const { getPlayer, numberformatter } = require('../helper/functions.js');

module.exports = {
    name: 'kuudra',
    description: 'Get a player\'s magic power and kuudra stats.',
    args: '[ign] [profile]',
    execute: async (discordClient, message, messageAuthor) => {
        let { 1: username, 2: profile } = message.split(' ');
        if (!username) username = messageAuthor;

        const searchedPlayer = await getPlayer(username, profile, true).catch((err) => minecraftClient.chat(`/gc @${messageAuthor} ${err}`));
	    if (!searchedPlayer?.memberData?.nether_island_player_data) return;
        const kuudra = searchedPlayer.memberData.nether_island_player_data.kuudra_completed_tiers;
        const tiers = ["none", "hot", "burning", "fiery", "infernal"].map((t, i) => `T${i + 1}: ${numberformatter(kuudra[t], 2)} comps, highest wave: ${kuudra[`highest_wave_${t}`] || 0}`);

        minecraftClient.chat(`/gc @${messageAuthor}${messageAuthor === username ? "'s" : ` ${username}'s`} kuudra stats are: | ${tiers.join(' | ')} | Magic Power: ${searchedPlayer.memberData.accessory_bag_storage.highest_magical_power || 0}.`);
    },
};
