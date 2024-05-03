const config = require('../config.json');
const nbt = require('prismarine-nbt');
const parseNbt = util.promisify(nbt.parse);
const { getPlayer, numberformatter } = require('../helper/functions.js');
const { skillTables } = require('../constants/global.js');


module.exports = {
    name: 'cataCalc',
    description: 'Get a player\'s cata Calculation.',
    args: '[ign] [profile]',
    execute: async (discordClient, message, messageAuthor) => {
        let { 1: level, 2: floor, 3: score, 4: username, 5: profile } = message.split(' ');

        if (!username) username = messageAuthor;
        if (!level || !floor || !score) return minecraftClient.chat(`/gc @${messageAuthor} Invalid arguments! Usage: !cataCalc [level] [floor (F0-M7)] [score (S+/S)] (ign) (profile)`);

        const searchedPlayer = await getPlayer(username, profile).catch((err) => {
            return minecraftClient.chat(`/gc @${messageAuthor} ${err}`);
        });

        // What's start level? How much XP needed?
        if (isNaN(level)) return minecraftClient.chat(`/gc @${messageAuthor} Invalid level!`);
        if (!searchedPlayer?.memberData?.dungeons?.dungeon_types?.catacombs?.experience) return;
        const curXP = searchedPlayer.memberData.dungeons.dungeon_types.catacombs.experience;
        const neededTotal = skillTables.dungeoneering[parseInt(level)];
        const needed = neededTotal - curXP;

        if (needed <= 0) return minecraftClient
            .chat(`/gc @${messageAuthor}${messageAuthor === username ? "'s" : ` ${username}'s`} level is already ${level}!`);

        // Has cata expert ring?
        if (!searchedPlayer?.memberData?.talisman_bag?.data) return;
        const taliNBTEncoded = searchedPlayer.memberData.talisman_bag.data;
        const taliNBTNonSimplified = await parseNbt(Buffer.from(taliNBTEncoded, 'base64'));
        const tali = await nbt.simplify(taliNBTNonSimplified);

        expertRing = false;
        try {
            for (const talisman of tali.i) {
                if (talisman.tag.ExtraAttributes.id === "CATACOMBS_EXPERT_RING") {
                    expertRing = true;
                    break;
                }
            }
        } catch (error) {
            console.error("Error checking for expert ring:", error);
        }

        // How much xp per floor?
        const floorXp = {
            sPlus: {
                f0: 50,
                f1: 80,
                f2: 160,
                f3: 400,
                f4: 1420,
                f5: 2400,
                f6: 5000,
                f7: 28000,
                m1: 10000,
                m2: 14444,
                m3: 35000, // certain
                m4: 61111,
                m5: 70000,
                m6: 100000, // certain
                m7: 300000, // certain
            },
            s: {
                f0: 45,
                f1: 72,
                f2: 144,
                f3: 360,
                f4: 1278,
                f5: 2160,
                f6: 4500,
                f7: 18000,
                m1: 9000,
                m2: 13000,
                m3: 31500,
                m4: 55000,
                m5: 63000,
                m6: 90000,
                m7: 270000,
            },
            perScore: {
                f0: 1 / 6,
                f1: 4 / 15,
                f2: 8 / 15,
                f3: 4 / 3,
                f4: 4.75,
                f5: 8,
                f6: 16.7,
                f7: 66.7,
                m1: 33.3,
                m2: 48.1,
                m3: 116 + 2 / 3,
                m4: 203.7,
                m5: 233 + 1 / 3,
                m6: 333 + 1 / 3,
                m7: 1000, // certain
            },
        };
        // const scores = { sPlus: 300, s: 269.5, a: 230, b: 160, c: 100, d: 1 }; Could add more than S+/S with this
        
        score = score.toLowerCase();
        if (score !== 's+' && score !== 's') return minecraftClient.chat(`/gc @${messageAuthor} Invalid score! Only S+ and S are supported!`);
        score = score === 's+' ? 'sPlus' : 's';
        floor = floor.toLowerCase();
        if (!(floor in floorXp.sPlus)) {
            return minecraftClient.chat(`/gc @${messageAuthor} Invalid floor! Use F0-M7!`);
        }
        // const floorBase = score === 's+' || score === 's' ? floorXp[score][floor] : floorXp.perScore[floor] * scores[score];
        const floorBase = floorXp[score][floor];

        // How much xp after bonus xp?
        let floorXP = expertRing ? floorBase * 1.1 : 0;
        // Could add more boni here

        // How many floors?
        const floors = Math.ceil(needed / floorXP);
        score = score === 'sPlus' ? 'S+' : 'S';
        minecraftClient.chat(`/gc @${messageAuthor}${messageAuthor === username ? "'s" : ` ${username}'s`} catacombs calculation: Total XP needed: ${numberformatter(needed, 2)} for ${level}, XP per ${floor} ${score}: ${numberformatter(floorXP, 2)}, Floors needed: ${floors})`);
    },
};

