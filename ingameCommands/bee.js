const config = require('../config.json');
const fs = require('fs');
const bee = fs.readFileSync('bee.txt', 'utf8').split('\n').filter(l => !!l);

module.exports = {
    name: 'bee',
    description: 'Print a random line from the bee movie script.',
    execute: async (discordClient, message, messageAuthor) => {
        minecraftClient.chat(`/gc @${messageAuthor} ${bee[Math.floor(Math.random() * bee.length)]}`);
    },
};
