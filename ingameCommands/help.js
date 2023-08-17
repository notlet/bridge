const config = require('../config.json');

module.exports = {
    name: 'help',
    description: 'Get a short help menu.',
    execute: async (discordClient, message, messageAuthor) => minecraftClient.chat(`/gc @${messageAuthor} To view all commands and their description, use the /help discord command. If you have ChatTriggers, you can import the NecroBridge module for bridge bot formatting, including commands output.`),
};
