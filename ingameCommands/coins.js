const config = require('../config.json');
const { getPlayer, numberformatter } = require('../helper/functions.js');

module.exports = {
    name: 'coins',
    description: 'Get a player\'s purse and bank balance.',
    args: '[ign] [profile]',
    execute: async (discordClient, message, messageAuthor) => {
        let { 1: username, 2: profile } = message.split(' ');
        if (!username) username = messageAuthor;

        const searchedPlayer = await getPlayer(username, profile).catch((err) => minecraftClient.chat(`/gc @${messageAuthor} ${err}`));
        if (!searchedPlayer.memberData) return;
		username = searchedPlayer.username;
        
        const coins = searchedPlayer.memberData.currencies.coin_purse;
        const motes = searchedPlayer.memberData.currencies.motes_purse;
        const bank = searchedPlayer.profileData.banking.balance;

        minecraftClient.chat(`/gc @${messageAuthor}${messageAuthor === username ? "" : ` ${username}`} has ${numberformatter(coins, 2)} purse${(motes && motes > 0) && `, ${numberformatter(motes, 2)} motes, `} and ${numberformatter(bank, 2)} coins in bank.`);
    },
};
