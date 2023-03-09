const { hypixelRequest, n, addCommas } = require('../helper/functions');
const { errorEmbed } = require('../helper/embeds');
const { MessageEmbed } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'help',
    description: 'Information about all commands',
    options: [],
    async execute(discordClient, interaction) {try{

	let ingameCommandsList = fs.readdirSync(process.cwd() + '/ingameCommands/').map(n => {
		let c = require(process.cwd() + '/ingameCommands/' + n);
		return `**!${c.name}${c.args ? " " + c.args : ""}** - ${c.description || "No description provided"}`;
	});

//        if (false) {
//            return interaction.editReply({
//                embeds: [errorEmbed(null, 'Something went wrong while running the command.')],
//            });
//        }

        return interaction.editReply({
            embeds: [
                new MessageEmbed()
			.setTitle("Commands Help")
			.setDescription("*[] - optional argument, () - required argument, {var1/var2} - varied argument*")
			.addFields(
				{name: "Discord Commands", value: "**/gexp [user]** - check total or a user's GEXP.\n**/link (username)** - links your ingame account to discord account.\n**/info** - general info about the guild.\n** /members** - list of all guild members.\n**/online** - list of all online guild members."},
				{name: "Ingame Commands", value: `*(can also be used in <#1052666581907406928>)*\n${ingameCommandsList.join("\n")}`}
			)
			.setColor('BLURPLE')
			.setFooter({text: "Source created by Altpapier#4847, bot is maintained by let_game#7020"})
            ],
        });
    } catch (e) {console.warn(e)}},
};
