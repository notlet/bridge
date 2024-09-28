const { MessageAttachment } = require('discord.js')
const config = require('../../config.json');
const { formatMentions, numberformatter } = require('../../helper/functions.js');
const messagesReactionCache = new Map();
const fs = require('fs');

module.exports = {
	execute: async (discordClient, message) => {
		if (message.author.bot) return;
		if (blacklist.users.includes(message.author.id)) return;

		let attachments = message.attachments;
		

		attachments = message.attachments.map(a => a.url);
		if (message.attachments.length == 0 && message.content === '') return;

		// it works
		message.content = message.content.replaceAll(/(?<=\W|^)(ez)(?=\W|$)/g, "éz")

		if (message.content.startsWith('\\')) {
			message.content = message.content.substring(1);
		}

		if (message.channelId === config.channels.ingameChatLog && message.content.startsWith("/") && !message.content.includes("coop")) {
			return minecraftClient.chat(message.content);
		} else if (message.channelId === config.channels.guildIngameChat || message.channelId === config.channels.officerIngameChat) {
            if (message.flags.toArray().includes('SUPPRESS_NOTIFICATIONS')) return;
			const command = message.channelId === config.channels.officerIngameChat ? '/oc' : '/gc';
			const linkedPlayers = JSON.parse(fs.readFileSync('./data/guildLinks.json'));
			let playerRank;
			if (linkedPlayers[message.author.id]) {
				const linkUsernames = JSON.parse(fs.readFileSync('./data/guildLinkUsernames.json'));
				const allRanks = JSON.parse(fs.readFileSync('./data/guildRanks.json'));
				playerRank = allRanks[linkedPlayers[message.author.id]];

				if (linkUsernames[message.author.id]) message.author.username = linkUsernames[message.author.id];
			}

			let messagePrefix = `${command} ${message.author.username}${playerRank ? " [" + playerRank + "]" : ""}: `;
			if (message.type === 'REPLY') {
				const repliedUser = message.mentions.repliedUser;
				if (repliedUser.id === discordClient.user.id) {
					const mentionedChannel = discordClient.channels.cache.get(message.reference.channelId);
					if (mentionedChannel) {
						const mentionedMessage = await mentionedChannel.messages.fetch(message.reference.messageId);
						const [attachment] = mentionedMessage.attachments.values();
						if (attachment?.name) {
							messagePrefix = `${command} ${message.author.username} replied to ${attachment.name.slice(0, -4)}: `;
							messagesReactionCache.set(mentionedMessage);
						}
					}
				} else messagePrefix = `${command} ${message.author.username} replied to ${repliedUser.username}: `;
			}

			message.content = await formatMentions(discordClient, message.content);
			message.content = message.content.replace(/\n/g, ' | ');
			let msg = (messagePrefix + message.content).substring(0, 256);

			if ((messagePrefix + message.content).length >= 256) {
				const toDelete = await message.reply(`This message was too long. Sending only the first 256 characters.\n(until \`...${(messagePrefix + message.content).substring(0, 256).slice(-25)}\`)`);
				setTimeout(async () => await toDelete.delete(), 5000);
			}
			if (config.options.messageSentConfirmation.failedReactions) {
				messagesReactionCache.set(msg.substring(4), message);
				setTimeout(() => { if (messagesReactionCache.get(msg.substring(4))) react(msg.substring(4), '⛔') }, 1000 * 3);
			}

			if (message.content.trim().startsWith('!')) {
				const cmd = message.content.trim().split(' ')[0].substring(1);
				const command = minecraftClient?.commands?.get(cmd === 'nw' ? 'networth' : cmd);
				if (command) {
					setTimeout(() => command.execute(discordClient, message.content, message.author.username), 500);
				}
			}

			//if (attachments.length > 0 && (messagePrefix + (msg + " ┇ " + attachments.join(" ")).trim()).length >= 256) {
			//	const toDelete2 = await message.reply('This message was too long. Skipping sending attachments.');
			//	setTimeout(async () => await toDelete2.delete(), 5000);
			//} else if (attachments.length > 0) msg = (msg + " ┇ " + attachments.join(" ")).trim()
			if (attachments.length > 0) msg = (`${msg} ┇ [${attachments.length} attachment${attachments.length > 1 ? "s" : ""}]`).trim()

			minecraftClient.chat(msg);
		}

		async function react(messageSent, reaction) {
			if (config.options.messageSentConfirmation.checkmarkReactions || config.options.messageSentConfirmation.failedReactions) {
				let message = messagesReactionCache.get(messageSent);

				if (!messageSent) message = Array.from(messagesReactionCache)?.[(messagesReactionCache?.size || 0) - 1]?.[1];
				if (message) {
					if ((config.options.messageSentConfirmation.checkmarkReactions && reaction === '✅') || (config.options.messageSentConfirmation.failedReactions && reaction === '⛔')) if (!message.reactions.cache.hasAny('✅', '⛔')) message.react(reaction);
					messagesReactionCache.delete(messageSent);
				}
			}
		}

		module.exports = { react };
	},
};
