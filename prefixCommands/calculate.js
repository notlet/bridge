const MathJS = require('mathjs');

module.exports = {
    name: "calculate",
    aliases: ["calc", "c", "math"],
    exec: (discordClient, message) => {
        let calculation = {success: false, reply: null};
        try {
            let input = message.content.split(" ").slice(1).join(" ").trim().replace(/\n/g, " \n ");
            if (["", null, undefined, "; "].includes(input)) throw new Error("No argument was provided!");
            calculation.reply = MathJS.evaluate(input);
            if (["", null, undefined, "; "].includes(calculation.reply)) throw new Error("Incorrect syntax or something went wrong during the calculation!");
            calculation.reply = MathJS.format(calculation.reply, 5);
            calculation.success = true;
        } catch (e) {
            calculation.reply = String(e);
            calculation.success = false;
        } finally {
            message.reply(`${calculation.success ? "✅" : "❌ **"} ${calculation.reply}${!calculation.success ? "**" : ""}.`);
        }
    } 
}