const start = require("./start");
const build = require("./build");

const commands = [start, build];

module.exports.createCommands = yargs => {
    commands.forEach(command => command(yargs));
};
