module.exports = {
    type: "cli-command",
    name: "cli-command-scaffold",
    create({ yargs, context }) {
        yargs.command("scaffold", "Generate boilerplate code", () => {
            return require("./scaffold")({ context });
        });
    }
};
