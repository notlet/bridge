module.exports = (discordClient) => {
    discordClient.on("messageDelete", message => { try {
        if (snipes[message.channel.id] == undefined) snipes[message.channel.id] = [];
        if (!message.author.tag !== "StickyBot#0392") snipes[message.channel.id].push({
            "author": message.author.tag, 
            "content": message.content,
            "attachments": message.attachments.map(a => a.url),
            "timestamp": Math.round(Date.now() / 1000)
        });
    } catch (e) {}});

    discordClient.on("messageDeleteBulk", messages => { try {
        if (snipes[messages.first().channel.id] == undefined) snipes[messages.first().channel.id] = [];
        snipes[messages.first().channel.id].push(...messages.filter(m => message.author.tag !== "StickyBot#0392").map(message => { return {
            "author": message.author.tag, 
            "content": message.content,
            "attachments": message.attachments.map(a => a.url),
            "timestamp": Math.round(Date.now() / 1000)
        } }).slice(-10));
    } catch (e) {}});

    discordClient.on("messageCreate", message => {
        if (message.content !== "!snipe") return;
        if (message.guild.id == "900248439907041290" && message.channel.id !== "928396350473777193" && message.author.id !== "478480501649309708") return;
        if (snipes.lastUsed[message.channel.id] && (Math.round(Date.now() / 1000) - snipes.lastUsed[message.channel.id]) < 10) return message.reply(`**The command is on cooldown!**\nTry again in about ${10 - (Math.round(Date.now() / 1000) - snipes.lastUsed[message.channel.id])} seconds!`);
        else snipes.lastUsed[message.channel.id] = Math.round(Date.now() / 1000);

        if (snipes[message.channel.id] == undefined) snipes[message.channel.id] = [];
        while (snipes[message.channel.id][0]?.timestamp && (Math.round(Date.now() / 1000) - snipes[message.channel.id][0].timestamp) > 300) snipes[message.channel.id].shift();

        let allSnipes = snipes[message.channel.id]?.map(s => {
            let time = Math.round(Date.now() / 1000) - s.timestamp;
            let content = s.content.length > 500 ? s.content.substr(0, 500) + " (...)" : s.content;
            return { "name": `${s.author} (<t:${s.timestamp}:R>)`, "value": `${content}${s.attachments ? '\n' + s.attachments.map(a => a.endsWith(".png") || a.endsWith(".jpg") ? `[<${a.split(".").slice(-1)} attachment>](${a})` : `<${a.split(".").slice(-1)} attachment>`).join(", ") : ""}`}
        });

        message.reply({content: null, embeds: [
            {
                "title": `Snipes in #${message.channel.name}`,
                "description": "⚠️ If this command gets abused, it will be removed.",
                "color": 12713984,
                "fields": allSnipes && allSnipes.length > 0 ? allSnipes : [{ "name": "<empty>", "value": "*No recent snipes found.*" }]
            }
        ]});
    })
}