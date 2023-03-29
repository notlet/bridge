const { Constants, MessageEmbed } = require('discord.js');
const { STRING } = Constants.ApplicationCommandOptionTypes;
const fs = require('fs');
const { calculateCost } = require('../helper/manacost.js');

module.exports = {
    name: "manacost",
    description: "Calculate a soul's mana cost",
    doNotDefer: true,
    options: [
      {
        "type": 3,
        "name": "health",
        "description": "The soul's health.",
        "required": true
      },
      {
        "type": 3,
        "name": "damage",
        "description": "The soul's damage.",
        "required": true
      },
      {
        "type": 4,
        "name": "ebreeze",
        "description": "Combined Breeze level on your equipment"
      },
      {
        "type": 4,
        "name": "abreeze",
        "description": "Combined Breeze level on your armor"
      },
      {
        "type": 4,
        "name": "sheeplvl",
        "description": "Your Sheep pet's level"
      }
    ],
    async execute(discordClient, interaction) {
        const param = name => interaction.options.get(name) !== null ? interaction.options.get(name).value : undefined;
        let message = calculateCost({"hp": param("health"), "dmg": param("damage"), "ebreeze": param("ebreeze"), "abreeze": param("abreeze"), "sheeplvl": param("sheeplvl")});
        interaction.reply(message.success ? {"content": message.response} : {"content": message.response, "ephemeral": true});
    },
};
