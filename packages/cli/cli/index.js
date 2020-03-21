const deploy = require("./deploy");

const commands = [deploy];

module.exports.createCommands = yargs => {
    commands.forEach(command => command(yargs));
};
