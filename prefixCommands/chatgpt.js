const { Configuration, OpenAIApi } = require("openai");
const fs = require('fs');
const openai = new OpenAIApi(new Configuration({ apiKey: require('../config.json').keys.openAiKey }));

function nearestHour() {
    const date = new Date(Date.now());
    const p = 60 * 60 * 1000; // milliseconds in an hour
    return Math.round(new Date(Math.ceil(date.getTime() / p ) * p).getTime() / 1000);
}

module.exports = {
    name: "chatgpt",
    aliases: ["cgpt", "gpt", "ai"],
    exec: async (discordClient, message) => {

        function getEmbed(fields, response) {
            return {
                content: null, 
                embeds: [
                    {
                        author: {
                            name: "ChatGPT", 
                            icon_url: "https://cdn.discordapp.com/attachments/954630834567135263/1081990488040681672/gpt.png"
                        }, 
                        title:`${message.author.username}'s Conversation`, 
                        description: typeof response.reply == "string" ? response.reply : null, 
                        color: response.success == false ? "#d60101" : response.success == "waiting" ? "#ff9d00" : "#00e000", 
                        footer: {text: `${gptCredits[message.author.id]} credits remaining`}, 
                        timestamp: message.createdAt,
                        fields: response.success ? getParsedMessages(fields).map(e => { return {"name": `${e.role == "user" ? "User" : e.role}`, "value": (e.content.length > 1010 ? e.content.substr(0, 1010) + " (...)" : e.content) || "<empty response>"} }) : []
                    }
                ]
            }
        }

        function getParsedMessages(rawMessages) {
            let result = [];
            for (const airesponse of rawMessages) {
                if (airesponse.content.length > 1000) {
                    (airesponse.content + " ").match(/[\s\S]{1,1000}\W/g).forEach((f2, i2) => result.push({"role": "ChatGPT", "content": f2}));
                } else result.push({"role": airesponse.role == "assistant" ? "ChatGPT" : "user", "content": airesponse.content});
            }
            return result;
        }

        if (message.guild.id == "900248439907041290" && message.author.id !== "478480501649309708") return message.reply(`<:literally1984:1058546639519895622> **GPT has been disabled in this server.**\nPlease use this command in a different server.`)
        if (!discordClient?.guilds?.cache?.get("900248439907041290")?.members?.cache?.get(message?.author?.id)?.roles?.cache?.has("904780924246454395") && message.author.id !== "478480501649309708") return;
        if (typeof gptCredits[message.author.id] !== 'number') gptCredits[message.author.id] = 5;
        if (message?.content?.length > 1000) return message.reply(`**The prompt you have entered is too long!**\n*(${message?.content?.length}/1000)*`);
        if (gptCredits[message.author.id] < 1) return message.reply(`**You are out of credits!**\nNext refresh <t:${nearestHour()}:R>.`);
        
        let responseMsg = await message.reply("<a:loading:997429178163019806> Please wait...");
        let response = {success: "waiting", reply: null};
        let input = message.content.split(" ").slice(1).join(" ").trim();
        if (["", null, undefined, "; "].includes(input)) return responseMsg.edit(getEmbed(userConversations[message.author.id] || [], {success: true, reply: `**You have ${gptCredits[message.author.id]} credits remaining.**\nNext refresh <t:${nearestHour()}:R>.\n\nUse \`!chatgpt reset\` to reset your conversation.`}));
        if (["rs", "reset", "r"].includes(input)) {
            userConversations[message.author.id] = [];
            return responseMsg.edit(`Successfully reset your conversation!`);
        }
        try {
            if (message.guild.id == "900248439907041290") {
                await responseMsg.edit("<a:loading:997429178163019806> Running prompt through moderation filter...");
                const moderationRawResponse = await openai.createModeration({model: "text-moderation-latest", input: input});
                const moderation = moderationRawResponse.data.results[0];
                if (moderation.flagged) throw new Error(`Your prompt got flagged by the moderation filter for the following reason(s):\n**${Object.keys(moderation.categories).filter(c => moderation.categories[c]).join('**, **')}**.\n\n*To use ChatGPT without moderation filter, please type the prompt on a different server.*`)
            }
            if (userConversations[message.author.id] == undefined) userConversations[message.author.id] = [];
            if (userConversations[message.author.id].length >= 20) throw new Error("**You have reached the maximum Chat Conversation length!**\nUse \`!chatgpt reset\` to reset it.")
            userConversations[message.author.id].push({"role": "user", "content": input});
            await responseMsg.edit(getEmbed([...userConversations[message.author.id].slice(-3), {"role": "assistant", "content": "<a:loading:997429178163019806> Creating completion..."}], response));
            
            response.reply = await openai.createChatCompletion({model: "gpt-3.5-turbo", messages: [{"role": "system", "content": misc_data.chatGPTSystemPrompt}, ...userConversations[message.author.id], {"role": "user", "content": input}]});
            if (["", null, undefined, "; "].includes(response.reply)) throw new Error("**Incorrect syntax or something went wrong during the response!**");
            response.success = true;
            userConversations[message.author.id].push(response.reply.data.choices[0].message);
            
            gptCredits[message.author.id] -= 1;
        } catch (e) {
            response.reply = String(e);
            response.success = false;
        } finally {
            responseMsg.edit(responseMsg.edit(getEmbed(userConversations[message.author.id].slice(-4), response.success ? {success: true, reply:"Use \`!chatgpt reset\` to reset your conversation."} : response)));
            fs.writeFileSync(process.cwd() + "/data/gptCredits.json", JSON.stringify(gptCredits));
        }
    } 
}