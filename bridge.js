const { CronJob } = require('cron');
const fs = require('fs');
const djs = require('discord.js');
const { numberformatter } = require('./helper/functions.js');
const discordClient = new djs.Client({
    intents: [djs.Intents.FLAGS.GUILDS, djs.Intents.FLAGS.GUILD_MESSAGES, djs.Intents.FLAGS.GUILD_MESSAGE_REACTIONS, djs.Intents.FLAGS.GUILD_MEMBERS],
});

const config = require('./config.json');
const mineflayer = require('mineflayer');

const minecraftLoginOptions = {
    host: 'mc.hypixel.net',
    port: 25565,
    username: config.minecraft.username,
    auth: config.minecraft.microsoftAuth ? 'microsoft' : 'mojang',
    version: '1.8.9',
    viewDistance: 'tiny',
    chatLengthLimit: 256,
};

//if (!config.minecraft.doNotUsePassword) minecraftLoginOptions.password = config.minecraft.password;

global.minecraftClient = mineflayer.createBot(minecraftLoginOptions);
global.nonBomb = {lastUsed: 0, active: false};
global.snipes = {lastUsed: {}};
global.misc_data = {nerds: [], chatGPTSystemPrompt: "You are an AI language model inside a Discord Bot created by user named LetGame, designed to help users out with their various problems."};
global.cronJobs = {};
global.itemImages = {
    hashMap: require('./data/neurepo/itemHash.json'),
    imageMap: require('./data/neurepo/images.json')
}

global.userConversations = {};
global.gptCredits = JSON.parse(fs.readFileSync(process.cwd() + "/data/gptCredits.json", {encoding: "utf8"}));
Object.keys(gptCredits).forEach(u => { 
    if (gptCredits[u] == null) gptCredits[u] = Infinity;
    if (typeof gptCredits[u] !== 'number') gptCredits[u] = undefined;
})

cronJobs.gptCreditsRefreshJob = new CronJob("0 * * * *", () => {
    Object.keys(gptCredits).forEach(u => { 
        if (gptCredits[u] == Infinity || gptCredits[u] > 10) return;
        gptCredits[u] = 10;
    })
}, null, true);

global.blacklist = JSON.parse(fs.readFileSync(process.cwd() + "/data/blacklist.json", {encoding: "utf8"}));
cronJobs.blacklistRefreshJob = new CronJob("*/5 * * * *", () => { blacklist = JSON.parse(fs.readFileSync(process.cwd() + "/data/blacklist.json", {encoding: "utf8"})) }, null, true);

startMinecraftBot(minecraftClient, discordClient);
async function startMinecraftBot(minecraftClient, discordClient) {
    minecraftClient.on('end', async () => {
        if (config.channels.logOptions.hypixelDisconnect) {
            await discordClient.channels.cache
                .get(config.channels.log)
                ?.send(`${config.minecraft.ingameName + ' has' || 'I have'} been disconnected from Hypixel. Trying to reconnect...`);
        }
        global.minecraftClient = mineflayer.createBot(minecraftLoginOptions);
        startMinecraftBot(minecraftClient, discordClient);
    });

    require('./handlers/minecraftEvents')(discordClient);
    require('./handlers/minecraftCommands')(discordClient);
}

require('./handlers/discordEvents')(discordClient);
require('./handlers/discordCommands')(discordClient);
require('./handlers/api')();
require('./sniper.js')(discordClient);

if (config.options.unknownDisconnectRelog) {
    setInterval(async () => {
        if (!minecraftClient?.player) {
            if (config.channels.logOptions.unknownDisconnect) {
                await discordClient.channels.cache
                    .get(config.channels.log)
                    ?.send(`${"**" + config.minecraft.ingameName + '** has' || 'I have'} been disconnected from Hypixel unexpectedly. Trying to reconnect...`);
            }
            try {
                minecraftClient.quit('Disconnected from Hypixel unexpectedly.');
            } catch (err) {
                console.error(err);
            }
            global.minecraftClient = mineflayer.createBot(minecraftLoginOptions);
            startMinecraftBot(minecraftClient, discordClient);
        } else minecraftClient.chat("/tip all");
    }, 1000 * 60 * 5); // 5 minutes
}

process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);

discordClient.login(config.keys.discordBotToken);
discordClient.on("ready", () => {discordClient.user.setActivity("with balls", { type: "PLAYING"})})

discordClient.on("messageCreate", message => {
    if (!(message.content.startsWith("!eval ") && message.author.id == "478480501649309708")) return;

    let { 1: params, 2: cmd } = message.content.replace(/\n/g, " ").match(/^!eval( -\w{1,3})? (.+)/i);
    console.log("Evaluating: " + cmd)
    const quickCommandsMatch = cmd.match(/%{[A-Z]+:?[^}]*}%/g);
    const allQuickCommands = require('./quickEvalCommands.js');
    if (quickCommandsMatch)
        for (const quickCommand of quickCommandsMatch) {
            let { 1: command, 2: args } = quickCommand.match(/%{([A-Z]+):?(.*?)}%/);
            if (allQuickCommands[command] == undefined) continue;
            console.log("Quick command: " + command + " | " + args);
            cmd = cmd.replace(quickCommand, allQuickCommands[command](args));
        }

    eval(`const evalFunc = async () => { ${cmd} }; evalFunc();`).then(r => {
        if (params?.includes("r")) {
            let resp = typeof r == 'object' ? JSON.stringify(r) : r;
            if (resp?.length > 1800 || params?.includes("f")) {
                message.channel.send({ content: `**Response is ${numberformatter(resp.length, 2)} characters long.** Sending it as a file.`, files: [new djs.MessageAttachment(Buffer.from(resp, 'utf-8'), "eval.txt")] });
            } else message.channel.send(`\`\`\`json\n${resp}\n\`\`\``);
        } else if (!params?.includes("r")) message.delete();
    }).catch(e => {
        message.channel.send(`**EVAL ERROR:**\n\`\`\`diff\n- ${e}\n\`\`\``);
        console.error(e)
    });
});