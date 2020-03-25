const WEBINY = "webiny*";

if (!process.env.DEBUG) {
    process.env.DEBUG = WEBINY;
}

if (!process.env.DEBUG.includes(WEBINY)) {
    process.env.DEBUG += `,${WEBINY}`;
}

const deploy = require("./deploy");
const run = require("./run");

const commands = [deploy, run];

module.exports.createCommands = yargs => {
    commands.forEach(command => command(yargs));
};
