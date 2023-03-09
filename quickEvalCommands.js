module.exports = {
    "DELETE": (id) => `message?.channel?.messages?.delete("${id}");`,
    "GETROLE": (id) => `message?.guild?.members?.fetch()?.then(ml => ml.filter(u => u?.roles?.cache?.has("${id}")).map(u => u?.user?.tag));`,
    "GETSNIPES": (id) => `snipes[${id ? id : "message.channel.id"}]?.sort((a, b) => a.timestamp - b.timestamp)?.map(e => e.timestamp + " " + e.author + ": " + e.content)?.join("\\n");`,
    "PERMS": (perms) => `
        const { Permissions } = require("discord.js");
        const permsMap = {
            modPerms: ["MANAGE_GUILD", "KICK_MEMBERS", "BAN_MEMBERS", "MANAGE_CHANNELS", "MANAGE_ROLES", "MANAGE_NICKNAMES", "MANAGE_EMOJIS_AND_STICKERS", "MANAGE_EVENTS", "MANAGE_THREADS", "MANAGE_WEBHOOKS", "MANAGE_MESSAGES", "MODERATE_MEMBERS", "MUTE_MEMBERS", "DEAFEN_MEMBERS", "MOVE_MEMBERS", "PRIORITY_SPEAKER", "VIEW_GUILD_INSIGHTS", "MENTION_EVERYONE", "VIEW_AUDIT_LOG"],
            generalPerms: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "USE_EXTERNAL_EMOJIS", "USE_EXTERNAL_STICKERS", "SEND_TTS_MESSAGES", "ADD_REACTIONS", "REQUEST_TO_SPEAK", "CONNECT", "SPEAK", "STREAM", "USE_VAD", "CHANGE_NICKNAME", "USE_APPLICATION_COMMANDS", "USE_PUBLIC_THREADS", "CREATE_PUBLIC_THREADS", "USE_PRIVATE_THREADS", "CREATE_PRIVATE_THREADS", "SEND_MESSAGES_IN_THREADS", "START_EMBEDDED_ACTIVITIES", "CREATE_INSTANT_INVITE"]
        };

        const permslist = new Permissions("${perms}").serialize(); 
        const modpermslist = permsMap.modPerms.map(p => p.split("_").map(e => e[0].toUpperCase() + e.substr(1).toLowerCase()).join(" ") + ": " + (permslist[p] == true ? "✓" : "✕"));
        const generalpermslist = permsMap.generalPerms.map(p => p.split("_").map(e => e[0].toUpperCase() + e.substr(1).toLowerCase()).join(" ") + ": " + (permslist[p] == true ? "✓" : "✕"));

        "PERMISSIONS FOR " + ${perms} + ":\\n\\n\\nGeneral Permissions: \\n\\n" + generalpermslist.join("\\n") + "\\n\\n\\nModerator Permissions: \\n\\n" + modpermslist.join("\\n") + "\\n\\nAdministrator: " + (permslist.ADMINISTRATOR ? "✓" : "✕");
    `
}
