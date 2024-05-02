const config = require('../config.json');
const nbt = require('prismarine-nbt');
const parseNbt = util.promisify(nbt.parse);
const { getPlayer, numberformatter } = require('../helper/functions.js');


module.exports = {
    name: 'cataCalc',
    description: 'Get a player\'s cata Calculation.',
    args: '[ign] [profile]',
    execute: async (discordClient, message, messageAuthor) => {
        let { 1: level, 2: floor, 3: score, 4: username, 5: profile } = message.split(' ');
        // let { 1: username, 2: profile } = message.split(' ');
        if (!username) username = messageAuthor;

        const searchedPlayer = await getPlayer(username, profile).catch((err) => {
            return minecraftClient.chat(`/gc @${messageAuthor} ${err}`);
        });

        // What's start level?
        if (!searchedPlayer?.memberData?.dungeons?.dungeon_types?.catacombs?.experience) return;
        const cataXP = searchedPlayer.memberData.dungeons.dungeon_types.catacombs.experience;
        console.log("Cata XP:", cataXP)

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
            console.error("Error checking for expert ring:", error)
        }
        console.log("Expert Ring:", expertRing)
        

        // Secret completion?
        // Experienced bonus?
        if (!searchedPlayer?.memberData?.dungeons?.dungeon_types?.catacombs) return;
        const cataData = searchedPlayer.memberData.dungeons.dungeon_types.catacombs;


        // Total xp bonus?

        // How much xp for desired level?

        // How many floors?




        // statsMessage = `/gc @${messageAuthor}${messageAuthor === username ? "'s" : ` ${username}'s`} trophy fish stats: ${statsMessage}`
        // minecraftClient.chat(statsMessage);
    },
};

