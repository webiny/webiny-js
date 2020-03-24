const deploy = require("./deploy");
const run = require("./run");

const commands = [deploy, run];

module.exports.createCommands = yargs => {
    commands.forEach(command => command(yargs));
};
