const { number } = require('mathjs');
const config = require('../config.json');
const { getPlayer, numberformatter } = require('../helper/functions.js');
const render = require('../helper/loreRenderer.js').renderLore;
const imgur = require('imgur-anonymous-uploader');

const allTypes = {
	gusher: '§fGusher',
	blobfish: '§fBlobfish',
	obfuscated_fish_1: '§fObfuscated 1',
	sulphur_skitter: '§fSulphur Skitter',
	steaming_hot_flounder: '§fFlounder',
	flyfish: '§aFlyfish',
	slugfish: '§aSlugfish',
	obfuscated_fish_2: '§aObfuscated 2',
	lava_horse: '§9Lavahorse',
	mana_ray: '§9Mana Ray',
	obfuscated_fish_3: '§9Obfuscated 3',
	volcanic_stonefish: '§9Volcanic Stonefish',
	vanille: '§9Vanille',
	soul_fish: '§5Soul Fish',
	karate_fish: '§5Karate Fish',
	skeleton_fish: '§5Skeleton Fish',
	moldfin: '§5Moldfin',
	golden_fish: '§6Golden Fish',
};

module.exports = {
    name: 'trophyfish',
    description: 'Get a player\'s trophy fish stats.',
    args: '[ign] [profile]',
    execute: async (discordClient, message, messageAuthor) => {
        if (!config.keys.imgurClientId) return;
		const uploader = new imgur(config.keys.imgurClientId);

        let { 1: username, 2: profile } = message.split(' ');
        if (!username) username = messageAuthor;

        const searchedPlayer = await getPlayer(username, profile).catch((err) => {
            return minecraftClient.chat(`/gc @${messageAuthor} ${err}`);
        });

		const trophyFish = searchedPlayer?.memberData?.trophy_fish;
        if (!trophyFish) return minecraftClient.chat(`/gc @${messageAuthor} Player does not have any trophy fish data.`);;
        
		const total = numberformatter(trophyFish.total_caught, 1);

		const maxLength = Math.max(...Object.values(allTypes).map(type => type.length));
		const types = {};
		Object.keys(allTypes).forEach(type => types[type] = [
			trophyFish[type + '_bronze'] || 0,
			trophyFish[type + '_silver'] || 0,
			trophyFish[type + '_gold'] || 0, 
			trophyFish[type + '_diamond'] || 0
		]);

		const formattedTypes = {};
		Object.keys(types).forEach(type => formattedTypes[type] = [
			types[type][0] > 0 ? '§8' + numberformatter(types[type][0], 1) : '§c×',
			types[type][1] > 0 ? '§7' + numberformatter(types[type][1], 1) : '§c×',
			types[type][2] > 0 ? '§6' + numberformatter(types[type][2], 1) : '§c×',
			types[type][3] > 0 ? '§b' + numberformatter(types[type][3], 1) : '§c×',
			`§f${numberformatter(types[type].reduce((a, b) => a + b), 1)}`
		]);

		const maxTypeLength = Math.max(...Object.values(formattedTypes).flat().map(n => n.length));
		const typeTable = Object.keys(types).map(type => `§7| ${allTypes[type].padStart(maxLength)} §7| ${formattedTypes[type].map(n => n.padStart(maxTypeLength)).join(' §7| ')} §7|`);

		const rendered = await render(`§6§l${username}'s Trophy Fish`, `§fTotal Caught: §l${total}\n§7${'='.repeat(typeTable[0].length - 26)}\n${typeTable.join('\n')}\n§7${'='.repeat(typeTable[0].length - 26)}`.split('\n'));

		require('fs').writeFileSync('./trophyfish.png', rendered);
		const uploadResponse = await uploader.uploadBuffer(rendered);
		if (!uploadResponse.url) return minecraftClient.chat(`/gc @${messageAuthor} Failed to upload image.`);

		minecraftClient.chat(`/gc @${messageAuthor} ${uploadResponse.url}`);
},
};

