const MathJS = require('mathjs');
const { toNum } = require('../helper/manacost.js');

module.exports = {
    name: 'calc',
    description: 'Evaulate a math expression.',
    args: '(expression)',
    execute: (discordClient, message, messageAuthor) => {
        let { 1: username } = message.split(' ');
        if (!username) username = messageAuthor;

        let calculation = {success: false, reply: null};
        try {
            let input = message.split(" ").slice(1).join(" ");
            if (["", null, undefined, "; "].includes(input)) throw new Error("No argument was provided!");
            input = input.replace(/[\d.,]+[kmbt]/gi, match => toNum(match));
            calculation.reply = MathJS.evaluate(input);
            if (["", null, undefined, "; "].includes(calculation.reply)) throw new Error("Incorrect syntax or something went wrong during the calculation!");
            calculation.reply = MathJS.format(calculation.reply, 5);
            calculation.success = true;
        } catch (e) {
            calculation.reply = String(e);
            calculation.success = false;
        } finally {
            minecraftClient.chat(`/gc @${messageAuthor} ${calculation.success ? "✓" : "✕"} ${calculation.reply.replace(/\./g, " .")}`);
        }
    } 
}