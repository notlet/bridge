const config = require('../config.json');
const { getPlayer, numberformatter } = require('../helper/functions.js');

module.exports = {
    name: 'coins',
    description: 'Get a player\'s purse and bank balance.',
    args: '[ign] [profile]',
    execute: async (discordClient, message, messageAuthor) => {
        let { 1: username, 2: profile } = message.split(' ');
        if (!username) username = messageAuthor;

        const searchedPlayer = await getPlayer(username, profile, true).catch((err) => minecraftClient.chat(`/gc @${messageAuthor} ${err}`));
	    if (!searchedPlayer?.memberData) return;
        const coins = searchedPlayer.memberData.coin_purse;
        const bank = searchedPlayer.profileData.banking.balance;

        minecraftClient.chat(`/gc @${messageAuthor}${messageAuthor === username ? "" : ` ${username}`} has ${numberformatter(coins, 2)} purse and ${numberformatter(bank, 2)} coins in bank.`);
    },
};
