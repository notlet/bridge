const axios = require('axios');
const fs = require('fs');
const { MessageAttachment } = require('discord.js');
const config = require('../../config.json');
const { formatDiscordMessage, includesIgnored, isGuildEvent, isShortGuildEvent, sleep, nameToUUID, addCommas, getGuildMemberData } = require('../../helper/functions.js');
const generateMessageImage = require('../../helper/messageToImage.js');
const { getRequirements, getRequirementEmbed } = require('../../helper/requirements.js');

const SHORT_STATS = {
    skyblockLevel: 'LVL',
    networth: 'NW',
    lilyWeight: 'LILY',
    senitherWeight: 'SEN',
    skillAverage: 'SA',
    hypixelLevel: 'HLVL',
    catacombs: 'CATA',
    slayer: 'SLAYER',
    bwLevel: 'BWSTARS',
    bwFKDR: 'BWFKDR',
};

let messagesCache = [];
let fragBotQueue = [];
let isInFragParty = false;
setInterval(() => {
    const { sendDiscordMessage } = require('../discord/ready.js');

    if (messagesCache.length > 0 && config.channels.ingameChatLog) {
        let messageString = messagesCache.join('\n');
        messagesCache = [];
        try {
            sendDiscordMessage({
                channelId: config.channels.ingameChatLog,
                messageObject: { content: formatDiscordMessage(messageString).slice(0, 1998) },
            });
        } catch (e) {
            console.error('Error sending message to discord. Client not ready yet.');
        }
    }
}, 2000);

function getLatestMessages() {
    return messagesCache;
}

module.exports = {
    getLatestMessages,
    async execute(discordClient, message) {
        const msgString = message.toString();
        let msgStringColor = message.toMotd();
        if (msgString.startsWith("Guild > ")) { //§2Guild > §b[MVP§2+§b] let_game §3[Summon]§f: i love amomger
            let match = msgStringColor.substr(10).match(/(§[a-f0-9]{1})(\[[§A-Za-z0-9\+]+\] )?([0-9A-Za-z_]{3,22})/i);
            //console.log(match);
            if (match) {
                const funnynames = require('../../data/funnynames.js');
                //console.log(funnynames, Object.keys(funnynames))
                if (Object.keys(funnynames).includes(match[3].trim()) && !nonBomb.active) msgStringColor = msgStringColor.replace(match[0], funnynames[match[3].trim()](match[1], match[2], match[3]));
                if (Math.round(Date.now() / 1000) - nonBomb.lastUsed > 300 && nonBomb.active) nonBomb.active = false; 
                if (nonBomb.active) msgStringColor = msgStringColor.replace(match[0], funnynames["non_bomb"](match[1], match[2], match[3]));
            }
        }
        if (msgString.match(/.+❤.+✎ Mana/)) return;
        // LIMBO CHECK
        try {
            const parsedMessage = JSON.parse(msgString);
            if (config.options.limbo) {
                if (parsedMessage.server !== 'limbo' && parsedMessage) {
                    return minecraftClient.chat('/limbo');
                } else if (parsedMessage.server === 'limbo') {
                    return;
                }
            } else {
                if (parsedMessage.gametype !== 'SKYBLOCK'  && parsedMessage) {
                    if (parsedMessage.gametype == 'MAIN') return setTimeout(() => minecraftClient.chat("/play skyblock"), 1000);
                    else return setTimeout(() => {minecraftClient.chat("/lobby"); setTimeout(() => {minecraftClient.chat("/play skyblock")}, 5000)}, 1000);
                } else if (parsedMessage.gametype === 'SKYBLOCK') {
                    return minecraftClient.chat("/warp home");
                }
            }
        } catch (e) {}

        // CONSOLE LOG
        if (!includesIgnored(msgString) && config.options.ingameChatConsoleLog) {
            console.log(message.toAnsi());
        }

        // INGAME CHAT LOG
        if (config.channels.ingameChatLog) {
            if (!includesIgnored(msgString.trim()) && msgString.trim().length > 0) {
                messagesCache.push(msgString.trim());
            }
        }

        // DISCORD CHAT LOG
        if (msgString === 'You cannot say the same message twice!') {
            const { react } = require('../discord/messageCreate.js');
            try {
                react(null, '⛔');
            } catch (e) {}
            return;
        }
        
        const msgRegex = /^(?:Guild|Officer) >(?: \[[A-Za-z+]+\])? ([a-zA-Z0-9_]{3,20})(?: \[[A-Za-z]+\])?: (.+)$/;
        if ((msgString.startsWith("Guild") || msgString.startsWith("Officer")) && msgRegex.test(msgString)) {
            const { react } = require('../discord/messageCreate.js');
            const match = msgString.match(msgRegex);
            const messageAuthor = match[1];
            const sentMsg = match[2];

            // INGAME COMMANDS
            if (sentMsg.trim().startsWith('!')) {
                const cmd = sentMsg.trim().split(' ')[0].substring(1);
                const command = minecraftClient?.commands?.get(cmd === 'nw' ? 'networth' : cmd);
                if (command) command.execute(discordClient, sentMsg, messageAuthor);
            }

            if (messageAuthor == config.minecraft.ingameName) {
                const bridgeMatch = /^(.+?)(?: \[[A-Za-z]+\])?: (.+)(?: ┇ https:\/\/cdn\.discordapp\.com\/.+)?$/;
                const bridgeAuthor = bridgeMatch[1];
                const bridgeSentMsg = bridgeMatch[2];

                try { react(sentMsg, '✅') } catch (e) {}
                if (!sentMsg.startsWith('@')) return;
            }

            let includedURLs = [];
            for (const url of sentMsg.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g) ||
                []) {
                if (await isValidLink(url)) {
                    includedURLs.push(url);
                }
            }

            if (msgString.startsWith('Guild')) {
                const bridgeChannel = discordClient.channels.cache.get(config.channels.guildIngameChat);
                if (bridgeChannel) {
                    let msgtosend = msgStringColor.substring(10)
                    if (messageAuthor == config.minecraft.ingameName && sentMsg.startsWith("@")) {
                        msgtosend = `§2C > §e${msgtosend.match(/@([^\s'@]+)/)[1]}§f: ${msgtosend.match(/@([^\s'@]+)'s/) ? msgtosend.match(/@(.+)/)[1] : msgtosend.match(/@[^\s'@]+ (.+)/)[1]}`;
                        msgtosend = msgtosend.replaceAll(" | ", "\n§8 - §f");
                    }

                    await bridgeChannel.send({ files: [new MessageAttachment(generateMessageImage(msgtosend), `${messageAuthor}.png`)] });

                    const includedURLs = sentMsg.match(/[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig)?.map(l => l.endsWith('.') ? l.slice(0, -1) : l) || [];
                    if (includedURLs.length > 0) await bridgeChannel.send({ content: includedURLs.join('\n'), allowedMentions: { parse: [] } });
                }
            } else {
                if (config.channels.officerIngameChat) {
                    const officerChannel = discordClient.channels.cache.get(config.channels.officerIngameChat);
                    if (officerChannel) {
                        await officerChannel.send({ files: [new MessageAttachment(generateMessageImage(msgStringColor.substring(12)), `${messageAuthor}.png`)] });
                        if (includedURLs.length > 0) await officerChannel.send({ content: includedURLs.join('\n'), allowedMentions: { parse: [] } });
                    }
                }
            }
        }
        if (isGuildEvent(msgString)) {
            const msg = msgString.includes('Guild >') ? msgStringColor.substring(10) : msgStringColor;
            const formattedMessage = isShortGuildEvent(msgString) ? msg : `§b${'-'.repeat(40)}\n${msg}\n§b${'-'.repeat(40)}`;
            const bridgeChannel = discordClient.channels.cache.get(config.channels.guildIngameChat);
            if (bridgeChannel) {
                await bridgeChannel.send({
                    files: [new MessageAttachment(generateMessageImage(formattedMessage), 'guildEvent.png')],
                });
            }
        }
        if (config.options.discordUseSlowCommand) {
            if (msgString.startsWith('Guild >') && msgString.includes('the chat throttle!') && !msgString.includes(':')) {
                const bridgeChannel = discordClient.channels.cache.get(config.channels.guildIngameChat);
                if (bridgeChannel) {
                    if (msgString.includes('enabled')) {
                        await bridgeChannel.setRateLimitPerUser(10);
                    } else {
                        await bridgeChannel.setRateLimitPerUser(config.options.discordDefaultSlow || 0);
                    }
                }
            }
        }

	if (msgString.startsWith("From [MVP+] let_game: !c ")) setTimeout(() => minecraftClient.chat(msgString.replace("From [MVP+] let_game: !c ", "")), 500);

        // GUILD REQUIREMENT MANAGMENT
        if (config.guildRequirement.enabled) {
            if (msgString.includes('has requested to join the Guild!') && !msgString.includes('Guild >')) {
                for (const m of message?.extra || []) {
                    const command = m?.clickEvent?.value;
                    if (command) {
                        const username = command.split(' ')[2];
                        const uuid = await nameToUUID(username);
                        if (uuid) {
                            if (require("../../data/blacklist.json").minecraftUsers.includes(uuid)) return minecraftClient.chat(`/oc ${username} (${uuid}) is blacklisted, ignoring requirements check!`);

                            const userRequirements = await getRequirements(uuid);

                            const playerData = await getGuildMemberData(username).catch((err) => {});
                            const discordLink = playerData?.player?.socialMedia?.links?.DISCORD;
                            if (!discordLink) minecraftClient.chat(`/oc ${username} does not have a discord link!`);
                            let guild = await discordClient?.guilds?.cache?.get("900248439907041290")?.members?.fetch()
                            let user = guild?.find(u => `${u?.user?.username}#${u?.user?.discriminator}` == (discordLink || undefined));
                            let overLevel10 = user?.roles?.cache?.has("1103722129075220561");

                            let requirementsMet = 0;
                            let requirementsMetSkyblock = 0;
                            let requirementsMetBedwars = 0;
                            let requirementsDescription = `${username}: `;
                            for (const [stat, requirement] of Object.entries(config.guildRequirement.requirements)) {
                                if (requirement instanceof Object && stat === 'slayer') {
                                    let slayerRequirementsMet = 0;
                                    const slayerDescription = [];
                                    for (const [slayerType, slayerLevel] of Object.entries(requirement)) {
                                        if ((userRequirements.slayer[slayerType] || 0) >= slayerLevel) {
                                            slayerRequirementsMet++;
                                        }
                                        slayerDescription.push(userRequirements.slayer[slayerType] || 0);
                                    }
                                    if (slayerRequirementsMet >= Object.keys(requirement).length) {
                                        requirementsMet++;
                                        requirementsMetSkyblock++;
                                    }
                                    requirementsDescription += `${stat.toUpperCase()}: ${slayerDescription.join('/')} ${
                                        slayerRequirementsMet >= Object.keys(requirement).length ? '✔' : '✖'
                                    } |`;
                                } else {
                                    if (userRequirements[stat] >= requirement) {
                                        requirementsMet++;
                                        if (!stat.includes('bw')) requirementsMetSkyblock++;
                                        else requirementsMetBedwars++;
                                        requirementsDescription += `${SHORT_STATS[stat]}: ${addCommas(userRequirements[stat]?.toFixed())} ✔ | `;
                                    } else {
                                        requirementsDescription += `${SHORT_STATS[stat]}: ${addCommas(userRequirements[stat]?.toFixed())} ✖ | `;
                                    }
                                }
                            }

                            requirementsDescription += `INSERVER: ${user ? "✔" : "✖"} | `
                            requirementsDescription += `MEE6LV10: ${overLevel10 ? "✔" : "✖"} | `

                            minecraftClient.chat(`/oc ${username}: ${requirementsDescription}`);
                            await sleep(1000);

                            let totalBwStats = 0;
                            for (const stat of Object.keys(config.guildRequirement.requirements)) {
                                if (stat.includes('bw')) {
                                    totalBwStats++;
                                }
                            }
                            if (
                                requirementsMet >=
                                    (config.guildRequirement.minRequired || (Object.keys(config.guildRequirement.requirements).length) && (user && overLevel10)) ||
                                (config.guildRequirement.acceptEitherSkyblockOrBedwars &&
                                    (requirementsMetBedwars >= totalBwStats ||
                                        requirementsMetSkyblock >= Object.keys(config.guildRequirement.requirements).length - totalBwStats))
                            ) {
                                if (config.guildRequirement.autoAccept) {
                                    const blacklist = (config.guildRequirement.autoAcceptBlacklist || []).map((b) => b.toLowerCase());
                                    if (blacklist.includes(uuid.toLowerCase()) || blacklist.includes(username.toLowerCase())) {
                                        minecraftClient.chat(`/oc ${username} is blacklisted!`);
                                    } else {
                                        minecraftClient.chat(command);
                                    }
                                } else {
                                    minecraftClient.chat(`/oc ${username} meets the requirements!`);
                                }
                            } else {
                                minecraftClient.chat(`/oc ${username} has not met the requirements!`);
                                await sleep(1000);
                                minecraftClient.chat(`/msg ${username} You don't meet the requirements! ${requirementsDescription}`)
                            }

                            const { sendDiscordMessage } = require('../discord/ready.js');
                            const embed = getRequirementEmbed(userRequirements, username, true, discordLink, user, overLevel10);
                            sendDiscordMessage({
                                channelId: config.channels.officerIngameChat,
                                messageObject: { embeds: [embed] },
                            });
                        }
                        break;
                    }
                }
            }
        }

        if (config.guildWelcome.enabled) {
            if (msgString.includes('joined the guild!') && !msgString.includes('Guild >')) {
                const username = msgString.startsWith('[') ? msgString.split(' ')[1] : msgString.split(' ')[0];
                minecraftClient.chat(`/gc ${config.guildWelcome.message.replace(/{USERNAME}/g, username)}`);
            }
        }

        // FRAG BOT (disable in config.fragBot.enabled)
        if (config.fragBot.enabled) {
            if (msgString.includes('has invited you to join their party!') && message.extra) {
                for (const m of message.extra) {
                    const command = m?.clickEvent?.value;
                    if (command) {
                        let whiteList = config.fragBot.whitelist;
                        if (config.fragBot.whitelistGuildMembers) {
                            const guildMembers = JSON.parse(fs.readFileSync('./data/guildMembers.json').toString());
                            whiteList = whiteList.concat(guildMembers);
                        }

                        const { 2: playerName } = command.split(' ');
                        if (whiteList.includes(playerName) || !config.fragBot.whitelistEnabled) {
                            fragBotQueue.push(playerName);
                            setTimeout(() => {
                                const index = fragBotQueue.indexOf(playerName);
                                if (index > -1) {
                                    fragBotQueue.splice(index, 1);
                                }
                            }, 1000 * 60); // 1 minute until timeout
                            if (fragBotQueue.length > 1) {
                                await minecraftClient.chat(
                                    `/w ${playerName} ${config.fragBot.addedToQueueMessage}`.replace('{WAIT_TIME}', (fragBotQueue.length - 1) * 7)
                                );
                            }
                            queue(minecraftClient);
                        }
                        break;
                    }
                }
            } else if (
                (msgString.includes('You left the party.') && !msgString.includes(':')) ||
                ((msgString.includes('That party has been disbanded') ||
                    msgString.includes("You don't have an invite to that player's party.") ||
                    msgString.includes('The party was disbanded')) &&
                    !msgString.includes(':'))
            ) {
                queue(minecraftClient);
            }
        }
    },
};

async function queue(minecraftClient) {
    if (isInFragParty) return;
    if (fragBotQueue.length < 1) {
        return (isInFragParty = false);
    }

    isInFragParty = true;
    const playerName = fragBotQueue[0];
    await sleep(1000);
    await minecraftClient.chat(`/p accept ${playerName}`);
    await sleep(1000);
    await minecraftClient.chat(`/pc ${config.fragBot.partyWelcomeMessage}`);
    await sleep(5000);
    const index = fragBotQueue.indexOf(playerName);
    if (index > -1) fragBotQueue.splice(index, 1);
    await minecraftClient.chat('/p leave');
    isInFragParty = false;
}

async function isValidLink(url) {
    if (url.includes('http') || url.includes('https')) {
        try {
            const res = await axios.get(url);
            if (res.status === 200) {
                return true;
            }
        } catch (e) {
            return false;
        }
    }
    return false;
}
