const fs = require('fs');
const config = require('../config.json');
const { getPlayer, numberformatter } = require('../helper/functions.js');

module.exports = {
    name: 'non',
    description: 'Turns everyone into a non for 5 minutes.',
    execute: async (discordClient, message, messageAuthor) => {
        let { 1: arg } = message.split(' ');
        if (Math.round(Date.now() / 1000) - nonBomb.lastUsed < 900) return minecraftClient.chat(`/gc @${messageAuthor} The Non Bomb needs to cool off! You will be able to launch it in ${900 - (Math.round(Date.now() / 1000) - nonBomb.lastUsed)} seconds.`);
        nonBomb.lastUsed = Math.round(Date.now() / 1000);
        nonBomb.active = true;
        minecraftClient.chat(`/gc @${messageAuthor} ${messageAuthor.toUpperCase()} HAS LAUNCHED THE NON BOMB! Everyone turns into a non for 5 minutes.`);
    },
};
