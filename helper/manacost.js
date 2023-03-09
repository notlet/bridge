// Skyblock Necromancy Cost Calculation Utility
// created by let_game

const abbreviate = value => {
    var number = value;
    let suffixes = ['', 'k', 'm', 'B', 'T', 'q', 'Q', 's', 'S', 'o', 'n', 'd'];
    var suffix = 0;
    while (number >= 1000 && suffix < suffixes.length - 1) {
        number = number / 1000;
        suffix = suffix + 1;
    };
    number = parseFloat(number).toPrecision(3);
    return String(parseFloat(number)) + suffixes[suffix];
}
const toNum = input => {
    if (typeof input !== "string") return NaN;
    let num = input.toLowerCase().replace(/[^0-9.kmbte+-]/g, "");
    switch (num[num.length - 1]) {
        case "k": return parseFloat(num) * 1e3;
        case "m": return parseFloat(num) * 1e6;
        case "b": return parseFloat(num) * 1e9;
        case "t": return parseFloat(num) * 1e12;
        default: return parseFloat(num);
    }
}

// the main function itself
const calculateCost = e => {
    try {
        // processing the values
        let params = {
            "hp": toNum(e.hp),
            "dmg": toNum(e.dmg),
            "equipmentBreeze": e.ebreeze ? Number(e.ebreeze) : 0,
            "armorBreeze": e.abreeze ? Number(e.abreeze) : 0,
            "sheeplvl": e.sheeplvl ? Number(e.sheeplvl) : 100
        }

        // checking if values are valid
        let checks = [
            {"check": (params.hp > 1e12 || params.dmg > 1e12), "error": 'Input number is too high! (1T cap)'},
            {"check": (params.equipmentBreeze < 0 || params.equipmentBreeze > 40), "error": "Equipment Breeze level is not in range of \`0-40\`!"},
            {"check": (params.armorBreeze < 0 || params.armorBreeze > 40), "error": "Armor Breeze level is not in range of \`0-40\`!"},
            {"check": (params.sheeplvl < 0 || params.sheeplvl > 100), "error": "Sheep level is not in range of \`0-100\`!"},
            {"check": (isNaN(params.hp) || isNaN(params.dmg)), "error": 'An error occured while parsing health and/or damage.'},
        ].filter(i => i.check);
        if (checks.length > 0) return {"success": false, "response": `**ERROR OCCURED:** ${checks[0].error}`};

        // doing the actual calculation
        let rawMana = params.hp / 100000 + params.dmg / 50;
        let maxReduction = ((params.armorBreeze > 0 ? rawMana : (rawMana * 0.67)) * (1 - (0.002 * params.sheeplvl))) * 0.5;
        let breezeReduction = params.equipmentBreeze > 0 || params.armorBreeze > 0 ? (maxReduction / 100) * (100 - (params.equipmentBreeze + params.armorBreeze)) : false
        
        // returning the output
        return {
            "success": true,
            "response": `**${abbreviate(params.hp)} health, ${abbreviate(params.dmg)} damage:**\n\nRaw Cost: \`${Math.floor(rawMana)} mana\`.${params.armorBreeze == 0 ? `\nMax Reduction with <:Wise_Dragon:987431547735015495>: \`${Math.floor(maxReduction)} mana\`.` : ""}\n${breezeReduction ? `Max Reduction with Breeze ${params.equipmentBreeze > 0 ? `<:Equipment_Breeze:987431545969201202> ${params.equipmentBreeze} and ` : ""}${params.armorBreeze > 0 ? `<:Armor_Breeze:987431544266297445> ${params.armorBreeze}` : `<:Wise_Dragon:987431547735015495>`}: \`${Math.floor(breezeReduction)} mana\`.` : ""}`
        };
    } catch (e) {
        return e;
    }
}

// exporting the functions
module.exports = {
    "calculateCost": calculateCost,
    "abbreviate": abbreviate,
    "toNum": toNum
}
