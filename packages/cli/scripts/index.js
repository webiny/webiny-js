const run = require("./run");

const commands = [run];

module.exports.createCommands = yargs => {
    commands.forEach(command => command(yargs));
};
