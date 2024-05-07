const config = require('../config.json');
const { getPlayer, addCommas } = require('../helper/functions.js');
const { getSenitherWeight, getLilyWeight } = require('../helper/weight.js');

module.exports = {
    name: 'weight',
    execute: async (discordClient, message, messageAuthor) => {
		let { 1: username, 2: profile } = message.split(' ');

		if (!username) username = messageAuthor;

		const searchedPlayer = await getPlayer(username, profile).catch((err) => minecraftClient.chat(`/gc @${messageAuthor} ${err}`));
        if (!searchedPlayer) return;
		username = searchedPlayer.username;
		
		const playerProfile = searchedPlayer.memberData;

		const senitherWeight = getSenitherWeight(playerProfile);
		const lilyWeight = getLilyWeight(playerProfile);

		minecraftClient.chat(
			`/gc @${messageAuthor}${messageAuthor === username ? '' : ` ${username}`} has ${addCommas(
				(senitherWeight.total + senitherWeight.totalOverflow).toFixed()
			)} senither weight and ${addCommas(lilyWeight.total.toFixed())} lily weight.`
		);
    },
};
