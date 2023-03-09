const { Configuration, OpenAIApi } = require("openai");
const fs = require('fs');
const openai = new OpenAIApi(new Configuration({ apiKey: require('../config.json').keys.openAiKey }));

function nearestHour() {
    const date = new Date(Date.now());
    const p = 60 * 60 * 1000; // milliseconds in an hour
    return Math.round(new Date(Math.ceil(date.getTime() / p ) * p).getTime() / 1000);
}

module.exports = {
    name: "gpt3",
    aliases: ["davinci"],
    exec: async (discordClient, message) => {

        //if (!discordClient?.guilds?.cache?.get("900248439907041290")?.members?.cache?.get(message?.author?.id)?.roles?.cache?.has("904780924246454395") && message.author.id !== "478480501649309708") return;
        if (message.guild.id == "900248439907041290" && message.author.id !== "478480501649309708") return message.reply(`<:literally1984:1058546639519895622> **GPT has been disabled in this server.**\nPlease use this command in a different server.`)
        if (typeof gptCredits[message.author.id] !== 'number') gptCredits[message.author.id] = 10;
        if (message?.content?.length > 2000) return message.reply(`**The prompt you have entered is too long!**\n*(${message?.content?.length}/2000)*`);
        if (gptCredits[message.author.id] < 2) return message.reply(`**You don't have enough credits!**\nNext refresh <t:${nearestHour()}:R>.`);

        let response = {success: false, reply: null};
        let input = message.content.split(" ").slice(1).join(" ").trim();
        if (["", null, undefined, "; "].includes(input)) return message.reply(`**You have ${gptCredits[message.author.id]} credits remaining.**\nNext refresh <t:${nearestHour()}:R>.`);
        let responseMsg = await message.reply("<a:loading:997429178163019806> Please wait...");
        try {
            if (message.guild.id == "900248439907041290") {
                await responseMsg.edit("<a:loading:997429178163019806> Running prompt through moderation filter...");
                const moderationRawResponse = await openai.createModeration({model: "text-moderation-latest", input: input});
                const moderation = moderationRawResponse.data.results[0];
                if (moderation.flagged) throw new Error(`Your prompt got flagged by the moderation filter for the following reason(s):\n**${Object.keys(moderation.categories).filter(c => moderation.categories[c]).join('**, **')}**.\n\n*To use GPT without moderation filter, please type the prompt on a different server.*`)
            }
            await responseMsg.edit("<a:loading:997429178163019806> Creating completion...");
            response.reply = await openai.createCompletion({model: "text-davinci-003", prompt: input, temperature: 0.7, max_tokens: 300});
            if (["", null, undefined, "; "].includes(response.reply)) throw new Error("**Incorrect syntax or something went wrong during the response!**");
            response.success = true;
            gptCredits[message.author.id] -= 2;
        } catch (e) {
            response.reply = String(e);
            response.success = false;
        } finally {
            responseMsg.edit(
                {
                    content: null, 
                    embeds: [
                        {
                            author: {
                                name: "GPT", 
                                icon_url: "https://cdn.discordapp.com/attachments/954630834567135263/1081990488040681672/gpt.png"
                            }, 
                            title:`${message.author.username}'s Prompt`, 
                            description: response.success ? `**${input}**${response.reply.data.choices[0].text}` : `${response.reply}`, 
                            color: response.success ? "#00e000" : "#d60101", 
                            footer: {text: `${gptCredits[message.author.id]} credits remaining`}, 
                            timestamp: message.createdAt
                        }
                    ]
            }
            );
            fs.writeFileSync(process.cwd() + "/data/gptCredits.json", JSON.stringify(gptCredits));
        }
    } 
}