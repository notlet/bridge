const fs = require('fs');

module.exports = () => {
    global.minecraftClient.commands = new Map();

    const commandFiles = fs.readdirSync('./ingameCommands/').filter(c => c.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`../ingameCommands/${file}`);
        if (command.name) {
            minecraftClient.commands.set(command.name, command);
        } else {
            continue;
        }
    }
};
