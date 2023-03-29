const { errorEmbed } = require('../../helper/embeds');

module.exports = {
    execute: async (discordClient, interaction) => {
        if (interaction.user.bot) return;
        if (!interaction.guildId) return; // DMs
        if (interaction.type !== 'APPLICATION_COMMAND') return;

        const cmd = interaction.commandName;
        const command = discordClient.commands.get(cmd);
        if (!command) return;
        if (!command.doNotDefer) await interaction.deferReply();

        command.execute(discordClient, interaction).catch((e) => {
            console.error(e);
            if (!command.doNotDefer) {
                return interaction.editReply({
                    embeds: [errorEmbed(null, 'An error occurred while executing this command.')],
                });
            } else {
                return interaction.reply({
                    embeds: [errorEmbed(null, 'An error occurred while executing this command.')],
                });
            }
        });
    },
};
