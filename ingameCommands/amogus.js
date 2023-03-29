const fs = require('fs');
const config = require('../config.json');
const { getPlayer, numberformatter } = require('../helper/functions.js');

module.exports = {
    name: 'amogus',
    description: 'Amogus.',
    execute: async (discordClient, message, messageAuthor) => {
	let { 1: arg, 2: page } = message.split(' ');
	if (messageAuthor == "Prodieu") messageAuthor = "MrBreen";
	let amogus = JSON.parse(fs.readFileSync(`${process.cwd()}/data/amogus.json`, {encoding: "utf8"}));

	if (["lb", "leaderboard"].includes(arg)) {
                let lbFull = [...amogus.contributions];
                lbFull.sort((a, b) => b.amount - a.amount);
                let lb = lbFull.slice(!isNaN(page) && Math.ceil(page) > 0 ? (Math.ceil(page) - 1) * 5 : 0, !isNaN(page) && Math.ceil(page) > 0 ? Math.ceil(page) * 5 : 5);
                let leaderboard = [];
                lb.forEach(e => leaderboard.push(`#${lbFull.findIndex(h => h.username == e.username) + 1} ${e.username}: ${e.amount}ඞ`));
                minecraftClient.chat(`/gc @${messageAuthor} ඞ Sussy Leaderboard ඞ ${!isNaN(page) && Math.ceil(page) > 1 ? '(Page ' + Math.ceil(page) + ') ' : ''}| ${leaderboard.join(" | ")}`);
        }
	if (["cd", "cooldown"].includes(arg)) {
		let time = -1;
		if (amogus.contributions.findIndex(e => e.username == messageAuthor) !== -1) {
			let user = amogus.contributions[amogus.contributions.findIndex(e => e.username == messageAuthor)];
			time = 300 - (Math.round(Date.now() / 1000) - user.lastUsed);
		}
		minecraftClient.chat(`/gc @${messageAuthor} You can among again ${time < 0 ? "now!" : 'in ' + time + ' seconds.'}`);
	} else {
		if (amogus.contributions.findIndex(e => e.username == messageAuthor) == -1) amogus.contributions.push({"username": messageAuthor, "amount": 1});
                else {
                        let user = amogus.contributions[amogus.contributions.findIndex(e => e.username == messageAuthor)];
                        if (Math.round(Date.now() / 1000) - user.lastUsed <= 300) return;
                        user.amount++;
                        user.lastUsed = Math.round(Date.now() / 1000);
                }
		amogus.counter++
                fs.writeFileSync(`${process.cwd()}/data/amogus.json`, JSON.stringify(amogus));
                minecraftClient.chat(`/gc @${messageAuthor} ඞ (${amogus.counter})`);
	}
    },
};
