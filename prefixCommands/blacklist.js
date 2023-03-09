const fs = require("fs");

module.exports = {
    name: "blacklist",
    aliases: ["bl"],
    exec: (discordClient, message) => {
        if (!discordClient?.guilds?.cache?.get("900248439907041290")?.members?.cache?.get(message?.author?.id)?.roles?.cache?.has("1055517672533663799")) return message.reply("**You dont have permissions to do this!**");
        const reply = stuff => message.reply({ content: stuff, allowedMentions: { parse: [] } });

        const args = message.content.split(" ").slice(1);
        if (["list", "l", "users", "u"].includes(args[0])) return reply(`**BLACKLISTED DISCORD IDs:**\n${blacklist.users.map(u => `<@${u}> \`${u}\``).join("\n")}\n\n**BLACKISTED MC UUIDs:**\n\`${blacklist.minecraftUsers.join("\`\n\`")}\``);
        else if (["add", "a", "remove", "r", "delete", "d"].includes(args[0])) {
            if (args.length < 3) return reply("**Not enough arguments! (expected 3, got " + args.length + ")**");
            const mode = ["add", "a"].includes(args[0]) ? 0 : 1
            if (["minecraft", "mc", "m"].includes(args[1])) {
                if (mode == 0) {
                    if (blacklist.minecraftUsers.includes(args[2])) return reply("**That user is already blacklisted!**");
                    blacklist.minecraftUsers.push(args[2]);
                } else {
                    if (!blacklist.minecraftUsers.includes(args[2])) return reply("**That user is not blacklisted!**");
                    blacklist.minecraftUsers = blacklist.minecraftUsers.filter(e => e !== args[2]);
                }
                reply(`**Successfully ${mode == 0 ? "added" : "removed"} \`${args[2]}\` ${mode == 0 ? "to" : "from"} the MC UUIDs blacklist!**`);
            } else if (["discord", "dc", "d"].includes(args[1])) {;
                const id = args[2].match(/(?:<@)?(\d{17,18})>?/)[1];
                if (!id) return reply("**Could not find that user on the server!**");
                if (mode == 0) {
                    if (blacklist.users.includes(id)) return reply("**That user is already blacklisted!**");
                    blacklist.users.push(id);
                } else {
                    if (!blacklist.users.includes(id)) return reply("**That user is not blacklisted!**");
                    blacklist.users = blacklist.users.filter(e => e !== id);
                }
                reply(`**Successfully ${mode == 0 ? "added" : "removed"} <@${id}> (\`${id}\`) ${mode == 0 ? "to" : "from"} the Discord IDs blacklist!**`);
            }
            fs.writeFileSync(process.cwd() + "/data/blacklist.json", JSON.stringify(blacklist));
        }
    }
}