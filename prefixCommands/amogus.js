const config = require('../config.json');
module.exports = {
    name: "amogus",
    exec: (discordClient, message) => {
        if (message.channelId !== config.channels.guildIngameChat && message.channelId !== config.channels.officerIngameChat) message.channel.send("https://i.imgur.com/equPKV3.gif");
    } 
}