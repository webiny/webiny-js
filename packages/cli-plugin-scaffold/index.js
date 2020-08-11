module.exports = {
    type: "cli-command",
    name: "cli-command-scaffold",
    create({ yargs, context }) {
        yargs.command("scaffold", "Generate boilerplate code", () => {
            return scaffold({ context });
        });
    }
};

const pluginToChoice = plugin => ({
    name: `${plugin.scaffold.name}`,
    value: plugin.name
});

const scaffold = async ({ context }) => {
    const inquirer = require("inquirer");
    const ora = require("ora");

    const scaffoldPlugins = context.plugins.byType("cli-plugin-scaffold-template");
    if (!scaffoldPlugins.length) {
        console.log(
            `🚨 We couldn't find any scaffolding plugins. Add plugins to your "webiny.root.js" file!`
        );
        process.exit(1);
    }

    const choices = Object.values(scaffoldPlugins).map(pluginToChoice);
    const { selectedPluginName } = await inquirer.prompt({
        type: "list",
        name: "selectedPluginName",
        message: "Pick a template to scaffold",
        choices
    });

    const { scaffold } = context.plugins.byName(selectedPluginName);
    const questions = scaffold.questions;

    const inqQuestions = typeof questions === "function" ? questions({ context }) : questions;

    const input = await inquirer.prompt(inqQuestions);
    const oraSpinner = ora().start(`Generating template...\n`);

    try {
        await scaffold.generate({ input, context, oraSpinner });
        oraSpinner.succeed("Done!");

        if (typeof scaffold.onSuccess === "function") {
            await scaffold.onSuccess({ input, context, oraSpinner });
        }
    } catch (e) {
        oraSpinner.stop();
        if (typeof scaffold.onError === "function") {
            await scaffold.onError({ input, context, oraSpinner, error: e });
        } else {
            console.log(e);
        }
        process.exit(1);
    }
};
