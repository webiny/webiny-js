const WEBINY = "webiny*";

if (!process.env.DEBUG) {
    process.env.DEBUG = WEBINY;
}

if (!process.env.DEBUG.includes(WEBINY)) {
    process.env.DEBUG += `,${WEBINY}`;
}

const tracking = require("./tracking");
const deploy = require("./deploy");
const remove = require("./remove");
const run = require("./run");

const commands = [deploy, run, remove, tracking];

module.exports.createCommands = yargs => {
    commands.forEach(command => command(yargs));
};
