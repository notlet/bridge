const { MessageAttachment } = require('discord.js');
const generateMessageImage = require('../helper/messageToImage.js');
const fs = require('fs');

const HEX_COLOR = {
    0: '#000000',
    1: '#0000aa',
    2: '#00aa00',
    3: '#00aaaa',
    4: '#aa0000',
    5: '#aa00aa',
    6: '#ffaa00',
    7: '#aaaaaa',
    8: '#555555',
    9: '#5555ff',
    a: '#55ff55',
    b: '#55ffff',
    c: '#ff5555',
    d: '#ff55ff',
    e: '#ffff55',
    f: '#ffffff'
};

module.exports = {
    name: "item",
    aliases: ["i", "sbitem"],
    exec: async (discordClient, message) => {
        let reply = await message.reply("<a:loading:997429178163019806> Please wait...");
        try {
            const id = message.content.split(" ").slice(1)?.join("_")?.toUpperCase();
            if (["", "_", null, undefined].includes(id)) throw new Error("No argument was provided!");

            const allItems = fs.readdirSync(process.cwd() + '/data/neurepo/items/').map(i => i.split("").slice(0, -5).join(""));
            if (!allItems.includes(id)) throw new Error("An item with this ID does not exist!");

            const item = require(`${process.cwd()}/data/neurepo/items/${id}.json`);
            const itemName = item.displayname.replace(/§[\w\d]/g, "");

            reply.edit({
                content: null,
                files: [new MessageAttachment(generateMessageImage(`${item.displayname}\n\n${item.lore.join('\n')}`), id.replace(/[^A-Za-z0-9]/g, "_") + '.png')],
                embeds: [
                    {
                        author: { name: id },
                        thumbnail: { url: itemImages.hashMap[id] || itemImages.hashMap["PET_" + id.split("").slice(0, -2).join("")] ? itemImages.imageMap[itemImages.hashMap[id]]?.normal || itemImages.imageMap[itemImages.hashMap["PET_" + id.split("").slice(0, -2).join("")]].normal : null },
                        image: { url: `attachment://${id.replace(/[^A-Za-z0-9]/g, "_")}.png` },
                        title: itemName,
                        description: item.infoType == "WIKI_URL" ? item.info.map(w => `[${w.startsWith("https://wiki.hypixel.net/") ? "Hypixel" : "Fandom"} Wiki](${w})`).join(", ") : null,
                        color: HEX_COLOR[item.displayname[1]] || '#ffffff',
                        footer: { text: `Requested by ${message.author.tag}` }, 
                        timestamp: message.createdAt
                    }
                ]
            })
        } catch (e) {
            reply.edit(`❌ **AN ERROR OCCURED:** ${e}`);
        }
    } 
}