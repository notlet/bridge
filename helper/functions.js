const axios = require('axios');
const { MessageButton, MessageActionRow } = require('discord.js');
const config = require('../config.json');
const nbt = require('prismarine-nbt');
const util = require('util');
const parseNbt = util.promisify(nbt.parse);
const nodeemoji = require("node-emoji");

function includesIgnored(message) {
    return config.channels.logOptions.ingameChatLogFilter.some((ignored) => message.includes(ignored));
}

function formatDiscordMessage(message) {
    return message.replace(/\*/g, '\\*').replace(/_/g, '\\_').replace(/~/g, '\\~').replace(/`/g, '\\`').replace(/>/g, '\\>');
}

const getLastProfile = data => data.profiles.find(p => p.selected) || data.profiles[0];

function isValidUsername(username) {
    if (username.match(/^[0-9a-zA-Z_]+$/)) {
        return true;
    } else {
        return false;
    }
}

async function getPlayer(player, profile, getPlayerData) {
    if (typeof player !== 'string' || !isValidUsername(player)) {
        throw new Error('Invalid Username');
    }

    const mojangResponse = await nameToUUIDFull(player);
    if (!mojangResponse) throw new Error('Player not found or UUID lookup error! | If you are sure the username is correct, just try again.');
	const { id: uuid, name: username } = mojangResponse;

    const hypixelResponse = await hypixelRequest(`https://api.hypixel.net/v2/skyblock/profiles?uuid=${uuid}`, true);
    console.log(hypixelResponse)
    if (!hypixelResponse) throw new Error("Couldn't get a response from the API");
    if (hypixelResponse.profiles === null) throw new Error(`Couldn\'t find any Skyblock profile that belongs to ${player}`);

    let hypixelResponse2 = {player: null}
    if (getPlayerData) hypixelResponse2 = await hypixelRequest(`https://api.hypixel.net/v2/player?uuid=${uuid}`, true);
    if (!hypixelResponse2 && getPlayerData) hypixelResponse2 = {player: null};

    let profileData = profile ? hypixelResponse.profiles.find((p) => p.cute_name.toLowerCase() === profile.toLowerCase()) : getLastProfile(hypixelResponse);

    if (!profileData) throw new Error(`Couldn't find the specified Skyblock profile that belongs to ${player}.`);

    return { memberData: profileData.members[uuid], profileData, profiles: hypixelResponse.profiles, playerData: hypixelResponse2.player, username };
}

async function getMuseum(profile, uuid) {
    const hypixelResponse = await hypixelRequest(`https://api.hypixel.net/v2/skyblock/museum?profile=${profile}`, true);
    if (!hypixelResponse) throw new Error("Couldn't get a response from the API");
    return hypixelResponse.members?.[uuid];
}

async function getGuildMemberData(player) {
    if (typeof player !== 'string' || !isValidUsername(player)) {
        throw new Error('Invalid Username');
    }

    const mojangResponse = await nameToUUID(player);
    if (!mojangResponse) throw new Error('Player not found or UUID lookup error!');

    const hypixelResponse = await hypixelRequest(`https://api.hypixel.net/v2/player?uuid=${mojangResponse}`, true);
    if (!hypixelResponse) throw new Error("Couldn't get a response from the API");
    if (!hypixelResponse?.player) throw new Error('This player never joined the Hypixel network before');

    return { player: hypixelResponse.player, uuid: mojangResponse };
}

async function decodeData(buffer) {
    const parsedNbt = await parseNbt(buffer);
    return nbt.simplify(parsedNbt);
}

async function formatMentions(client, message) {
    if (message.includes('<@') && message.includes('>') && !message.includes('<@&')) {
        const guildId = client.channels.cache.get(config.channels.guildIngameChat)?.guildId;
        const mentions = message.match(/<@!?\d+>/g);
        const members = await client.guilds.cache.get(guildId)?.members?.fetch();
        for (const mention of mentions) {
            const user = members.get(mention.replace(/[^0-9]/g, ''));
            if (user) {
                message = message.replace(mention, `@${user.user.username}`);
            } else {
                message = message.replace(mention, `@Unknown User`);
            }
        }
    }
    if (message.includes('<@&') && message.includes('>')) {
        const guildId = client.channels.cache.get(config.channels.guildIngameChat)?.guildId;
        const mentions = message.match(/<@&\d+>/g);
        const roles = await client.guilds.cache.get(guildId)?.roles.fetch();
        for (const mention of mentions) {
            const role = roles.get(mention.replace(/[^0-9]/g, ''));
            if (role) {
                message = message.replace(mention, `@${role.name}`);
            } else {
                message = message.replace(mention, `@Unknown Role`);
            }
        }
    }
    if (message.includes('<#') && message.includes('>')) {
        const guild = client.channels.cache.get(config.channels.guildIngameChat)?.guild;

        const mentions = message.match(/<#\d+>/g);
        for (const mention of mentions) {
            message = message.replace(mention, `#${guild?.channels?.cache?.get(mention.replace(/[^0-9]/g, ''))?.name || 'deleted-channel'}`);
        }
    }
    if ((message.includes('<a:') || message.includes('<:')) && message.includes('>')) {
            const customEmojis = message.match(/<a?:[^:]+:\d+>/g);
            for (const emoji of customEmojis) {
                message = message.replace(emoji, `:${emoji.replace(/<a?:([^:]+):\d+>/, "$1")}:`);
            }
    }

    message = nodeemoji.unemojify(message);

    return message;
}

const eventSettings = config.ingameChatEvents;
function isGuildEvent(message) {
    if (message.includes('Commands') || message.includes(':')) return false;
    return (
        (message.includes('joined the guild!') && eventSettings.guildJoin) ||
        (message.includes('left the guild!') && eventSettings.guildLeave) ||
        (message.includes('was kicked from the guild by') && eventSettings.guildKick) ||
        (message.includes('has muted') && eventSettings.guildMute) ||
        (message.includes('has unmuted') && eventSettings.guildUnmute) ||
        (message.includes('set the Guild Description to') && eventSettings.guildDescription) ||
        (message.includes('as a Guild Game.') && eventSettings.guildAddedGame) ||
        (message.includes('The Guild has reached') && eventSettings.guildLevelUp) ||
        (message.includes('Guild Visibility') && eventSettings.guildVisibilitySetting) ||
        (message.includes('Guild >') && message.includes('the chat throttle!') && eventSettings.guildChatThrottle) ||
        (message.includes('GUILD QUEST TIER') && eventSettings.guildQuest) ||
        (message.includes('gifted the') && message.includes('rank to') && eventSettings.guildRankGift) ||
        (message.includes('They have gifted') && message.includes('ranks so far!') && eventSettings.guildRankGift) ||
        (message.includes('was promoted from') && eventSettings.guildPromote) ||
        (message.includes('was demoted from') && eventSettings.guildDemote) ||
        (message.includes('joined.') && message.includes('Guild >') && eventSettings.guildPlayerJoin) ||
        (message.includes('left.') && message.includes('Guild >') && eventSettings.guildPlayerLeave)
    );
}

function isShortGuildEvent(message) {
    if (message.includes('Commands') || message.includes(':')) return false;
    return (
        (message.includes('Guild >') && message.includes('the chat throttle!') && eventSettings.guildChatThrottle) ||
        (message.includes('gifted the') && message.includes('rank to') && eventSettings.guildRankGift) ||
        (message.includes('They have gifted') && message.includes('ranks so far!') && eventSettings.guildRankGift) ||
        (message.includes('joined.') && message.includes('Guild >') && eventSettings.guildPlayerJoin) ||
        (message.includes('left.') && message.includes('Guild >') && eventSettings.guildPlayerLeave)
    );
}

function createCollector({ interaction, reply, callback }) {
    let collector;
    try {
        collector = reply.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, time: 1000 * 60 });
        collector.on('collect', async (i) => {
            collector.resetTimer();
            i.deferUpdate().catch((err) => err);
            await callback(i);
        });
        collector.on('end', (r) => {
            interaction.editReply({ components: [] }).catch((err) => err);
        });
    } catch (e) {}
    return collector;
}

async function hypixelRequest(url, useKey) {
    try {
        if (useKey) {
            return (await axios.get(url, { headers: { 'API-Key': config.keys.hypixelApiKey } })).data;
        } else {
            return (await axios.get(url)).data;
        }
    } catch (e) {
        return e;
    }
}

async function nameToUUID(name) {
    try {
        return (await axios.get(`https://api.mojang.com/users/profiles/minecraft/${name}`)).data.id;
    } catch (e) {
        return null;
    }
}

async function nameToUUIDFull(name) {
    try {
		const data = (await axios.get(`https://api.mojang.com/users/profiles/minecraft/${name}`)).data;
        if (!data) return (await axios.get(`https://api.mojang.com/users/profiles/minecraft/${name}`)).data;
		return data;
    } catch (e) {
        return null;
    }
}

async function UUIDtoName(uuid) {
    try {
        return (await axios.get(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`)).data.name;
    } catch (e) {
        return null;
    }
}

function numberformatter(numinput, num2) {
    let num = Number(numinput);
    if (isNaN(num)) return numinput;
    if (num > 999999999999) return Math.abs(num) > 999999999999 ? Math.sign(num) * (Math.abs(num) / 1000000000000).toFixed(num2) + 'T' : Math.sign(num) * Math.abs(num);
    if (num > 999999999) return Math.abs(num) > 999999999 ? Math.sign(num) * (Math.abs(num) / 1000000000).toFixed(num2) + 'B' : Math.sign(num) * Math.abs(num);
    if (num > 999999) return Math.abs(num) > 999999 ? Math.sign(num) * (Math.abs(num) / 1000000).toFixed(num2) + 'M' : Math.sign(num) * Math.abs(num);
    if (num > 999) return Math.abs(num) > 999 ? Math.sign(num) * (Math.abs(num) / 1000).toFixed(num2) + 'K' : Math.sign(num) * Math.abs(num);
    if (num <= 999) return num.toFixed(0);
}

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function n(string) {
    const result = string.split(/\r?\n/).map((row) => row.trim().split(/\s+/).join(' '));
    return result.join('\n').trim();
}

function addCommas(num) {
    try {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    } catch (err) {
        return 0;
    }
}

function toFixed(num, fixed) {
    let re = new RegExp('^-?\\d+(?:.\\d{0,' + (fixed || -1) + '})?');
    return num.toString().match(re)[0];
}

function hypixelLevel(exp) {
    // CREDIT: https://github.com/slothpixel/core/blob/c158ba49a9053ee7398195ef8baa1a7a2c36c570/util/calculateLevel.js
    const BASE = 10000;
    const GROWTH = 2500;
    const REVERSE_PQ_PREFIX = -(BASE - 0.5 * GROWTH) / GROWTH;
    const REVERSE_CONST = REVERSE_PQ_PREFIX * REVERSE_PQ_PREFIX;
    const GROWTH_DIVIDES_2 = 2 / GROWTH;

    return exp <= 1 ? 1 : Math.floor(1 + REVERSE_PQ_PREFIX + Math.sqrt(REVERSE_CONST + GROWTH_DIVIDES_2 * exp));
}

async function paginator(interaction, embeds) {
    const BUTTONS = [
        new MessageButton().setEmoji('⬅️').setStyle('PRIMARY').setCustomId('back').setDisabled(true),
        new MessageButton().setEmoji('➡️').setStyle('PRIMARY').setCustomId('forward'),
    ];

    if (embeds.length == 1) BUTTONS[1].setDisabled(true);

    let selectedPage = 1;
    const reply = await interaction.editReply({
        embeds: [embeds[selectedPage - 1]],
        components: [new MessageActionRow().addComponents(BUTTONS[0], BUTTONS[1])],
    });

    const collector = reply.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, time: 1000 * 60 });

    collector.on('collect', async (i) => {
        collector.resetTimer();
        switch (i.customId) {
            case 'back':
                selectedPage -= 1;
                break;
            case 'forward':
                selectedPage += 1;
                break;
        }
        if (selectedPage <= 1) {
            selectedPage = 1;
            BUTTONS[0].setDisabled(true);
            BUTTONS[1].setDisabled(false);
        } else if (selectedPage >= embeds.length) {
            selectedPage = embeds.length;
            BUTTONS[0].setDisabled(false);
            BUTTONS[1].setDisabled(true);
        } else {
            BUTTONS[0].setDisabled(false);
            BUTTONS[1].setDisabled(false);
        }
        await interaction.editReply({
            embeds: [embeds[selectedPage - 1]],
            components: [new MessageActionRow().addComponents(BUTTONS[0], BUTTONS[1])],
        });
        await i.deferUpdate();
    });
}

module.exports = {
    includesIgnored,
    formatDiscordMessage,
    isGuildEvent,
    hypixelRequest,
    nameToUUID,
    UUIDtoName,
    numberformatter,
    sleep,
    n,
    addCommas,
    toFixed,
    paginator,
    hypixelLevel,
    formatMentions,
    getPlayer,
    getMuseum,
    decodeData,
    createCollector,
    getGuildMemberData,
    isShortGuildEvent,
};
