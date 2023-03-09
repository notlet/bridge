const { MessageAttachment } = require('discord.js')
const config = require('../../config.json');
const { formatMentions, numberformatter } = require('../../helper/functions.js');
const messagesReactionCache = new Map();
const fs = require('fs');

let recentEmoji = { name: "", amt: 0 };

module.exports = {
	execute: async (discordClient, message) => {
		if (message.author.bot) return;
		if (blacklist.users.includes(message.author.id)) return;

		let attachments = message.attachments;
		

		attachments = message.attachments.map(a => a.url);
		if (message.attachments.length == 0 && message.content === '') return;

		let sus = message.content.match(/a?mon?g ?(?:us|er)|amog|sus|ඞ/gi)
		if (sus) sus.length > 1 ? message.react("<a:amogus_fast:1081129163953549332>") : message.react("<a:amogus:956111710232649789>");
		if (message.content.match(/let.?game|game.?let|glame|478480501649309708/i)) message.react("<:amogus:990281168366731294>");
        if (message.content.match(/sil\wer|1984|808106580905689158/i)) message.react("<:literally1984:1058546639519895622>");
		if (misc_data.nerds.includes(message.author.id)) message.reply({ content: `<:nerd:990281891296976936> "${message.content}"`, allowedMentions: { parse: [] } });

		if (message.content.startsWith("+react ") || message.content.includes("+emoji ")) {
			if (message.content.startsWith("+react") && (!message.reference || !message.reference.messageId)) return;

			const match = message.content.replace(/.*\+(?:react|emoji) /g, "").match(/([0-9]{17,})|([a-zA-Z0-9_]+)(~[0-9]{1,2})?/);

			const matchingEmojis = Object.values(discordClient.emojis.cache.filter(e => {
				if (match[1]) return e.id == match[1];
				else if (match[2]) return e.name.toLowerCase() == match[2].toLowerCase();
			}).toJSON());

			if (matchingEmojis.length < 1) return;
			const emoji = match[3] ? parseInt(match[3].substr(1)) < matchingEmojis.length ? matchingEmojis[parseInt(match[3].substr(1))] : matchingEmojis[0] : matchingEmojis[0];
			const emojiStr = `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`;

			if (message.content.startsWith("+react")) {
				message.channel.messages.cache.get(message.reference.messageId).react(emojiStr);
				return message.delete()
			} else {
				if (recentEmoji.name == emoji.name && recentEmoji.amt > 3) return;
				else if (recentEmoji.name == emoji.name) recentEmoji.amt++;
				else recentEmoji = { name: emoji.name, amt: 1 };
				message.reply(emojiStr);
			}
		}

        if (message.content.startsWith("!") && !(message.channelId === config.channels.guildIngameChat || message.channelId === config.channels.officerIngameChat)) {
            const prefixCommands = fs.readdirSync(process.cwd() + '/prefixCommands').map(c => {
                const command = require('../../prefixCommands/' + c);
                if (!command) return null;
                return {name: command.name, aliases: command.aliases ? command.aliases : [], exec: command.exec};
            });
            let index = prefixCommands.findIndex(c => c.name == message?.content?.substr(1)?.split(" ")[0] || c.aliases.includes(message?.content?.substr(1)?.split(" ")[0]));
            if (index >= 0) return prefixCommands[index].exec(discordClient, message);
        }

		if (message.content.startsWith('\\')) {
			message.content = message.content.substring(1);
		}

		if (message.channelId === config.channels.ingameChatLog && message.content.startsWith("/") && !message.content.includes("coop")) {
			return minecraftClient.chat(message.content);
		} else if (message.channelId === config.channels.guildIngameChat || message.channelId === config.channels.officerIngameChat) {
            if (message.flags == 4096) return;
			const command = message.channelId === config.channels.officerIngameChat ? '/oc' : '/gc';
			const linkedPlayers = JSON.parse(fs.readFileSync('./data/guildLinks.json'));
			let playerRank;
			if (linkedPlayers[message.author.id]) {
				const linkUsernames = JSON.parse(fs.readFileSync('./data/guildLinkUsernames.json'));
				const allRanks = JSON.parse(fs.readFileSync('./data/guildRanks.json'));
				playerRank = allRanks[linkedPlayers[message.author.id]];

				if (linkUsernames[message.author.id]) {
					message.author.username = linkUsernames[message.author.id];
				}
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
				} else {
					messagePrefix = `${command} ${message.author.username} replied to ${repliedUser.username}: `;
				}
			}

			message.content = await formatMentions(discordClient, message.content);
			message.content = message.content.replace(/\n/g, '');
			let msg = (messagePrefix + message.content).substring(0, 256);

			if ((messagePrefix + message.content).length >= 256) {
				const toDelete = await message.reply('This message was too long. Sending only the first 256 characters.');
				setTimeout(async () => {
					await toDelete.delete();
				}, 5000);
			}
			if (config.options.messageSentConfirmation.failedReactions) {
				messagesReactionCache.set(msg.substring(4), message);
				setTimeout(() => {
					if (messagesReactionCache.get(msg.substring(4))) {
						react(msg.substring(4), '⛔');
					}
				}, 1000 * 3);
			}

			if (message.content.trim().startsWith('!')) {
				const cmd = message.content.trim().split(' ')[0].substring(1);
				const command = minecraftClient?.commands?.get(cmd === 'nw' ? 'networth' : cmd);
				if (command) {
					setTimeout(() => command.execute(discordClient, message.content, message.author.username), 500);
				}
			}

			if (attachments.length > 0 && (messagePrefix + (msg + " ✎ " + attachments.join(" ")).trim()).length >= 256) {
				const toDelete2 = await message.reply('This message was too long. Skipping sending attachments.');
				setTimeout(async () => {
					await toDelete2.delete();
				}, 5000);
			} else if (attachments.length > 0) msg = (msg + " ✎ " + attachments.join(" ")).trim()

			minecraftClient.chat(msg);
		}

		async function react(messageSent, reaction) {
			if (config.options.messageSentConfirmation.checkmarkReactions || config.options.messageSentConfirmation.failedReactions) {
				let message = messagesReactionCache.get(messageSent);
				if (!messageSent) {
					message = Array.from(messagesReactionCache)?.[(messagesReactionCache?.size || 0) - 1]?.[1];
				}
				if (message) {
					if (
						(config.options.messageSentConfirmation.checkmarkReactions && reaction === '✅') ||
						(config.options.messageSentConfirmation.failedReactions && reaction === '⛔')
					) {
						if (!message.reactions.cache.hasAny('✅', '⛔')) message.react(reaction);
					}
					messagesReactionCache.delete(messageSent);
				}
			}
		}

		module.exports = {
			react,
		};
	},
};
