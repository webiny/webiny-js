const api = require("./api");

const commands = [api];

module.exports.createCommands = yargs => {
    commands.forEach(command => command(yargs));
};
