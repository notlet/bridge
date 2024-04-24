const config = require('../config.json');
const { getPlayer, decodeData } = require('../helper/functions.js');
const { renderLore } = require('../helper/loreRenderer');
const axios = require('axios');
const FormData = require('form-data');
// const { ImgurClient } = require('imgur');

// const imgur = new ImgurClient({ clientId: '14022e15990f3cb', clientSecret: '1e873b029e0faa86733a7a27b4bcd50b46b363b6' });

module.exports = {
    name: 'render',
    description: 'Render a player\'s item.',
    args: '[ign] [profile] (slot)',
    execute: async (discordClient, message, messageAuthor) => {
        let { 1: username, 2: profile, 3: itemNumber } = message.split(' ');

        if (!username) username = messageAuthor;

        if (!isNaN(Number(profile))) {
            itemNumber = profile;
        }
        if (!isNaN(Number(username))) {
            itemNumber = username;
            username = messageAuthor;
        }

        if (itemNumber < 1 || itemNumber > 9 || !itemNumber)
            return minecraftClient.chat(`/gc @${messageAuthor} Invalid item number. Must be between 1 and 9.`);

        const searchedPlayer = await getPlayer(username, profile).catch((err) => minecraftClient.chat(`/gc @${messageAuthor} ${err}`));
        username = searchedPlayer.username;
        
        const playerProfile = searchedPlayer.memberData;

        const inventory = playerProfile?.inv_contents?.data;
        if (!inventory) {
            return minecraftClient.chat(
                `/gc @${messageAuthor}${
                    messageAuthor === username ? '' : ` ${username}`
                } has no items in their inventory or has their inventory API disabled.`
            );
        }

        const inventoryData = (await decodeData(Buffer.from(inventory, 'base64'))).i;
        const selectedItem = inventoryData[itemNumber - 1];
        if (!selectedItem || !Object.keys(selectedItem || {}).length) {
            return minecraftClient.chat(`/gc @${messageAuthor} This player does not have an item in slot ${itemNumber}.`);
        }
        
        const renderedItem = await renderLore(selectedItem?.tag?.display?.Name, selectedItem?.tag?.display?.Lore);
        const messageUpload = await discordClient.guilds.cache.get('900248439907041290').channels.cache.get('1052691628013404241').send({
            content: `<t:${Math.round(Date.now() / 1000)}> | \`${username}\` \`item ${itemNumber}\`.`,
            files: [ { attachment: renderedItem, name: `${username}_item_${itemNumber}.png` } ]
        });

        const url = messageUpload.attachments.first()?.url;
        
        if (!url) return minecraftClient.chat(`/gc @${messageAuthor} Failed to upload image.`);

        minecraftClient.chat(`/gc @${messageAuthor} ${url}`);
    },
};
