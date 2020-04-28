const inquirer = require("inquirer");
const ora = require("ora");

const pluginToChoice = plugin => ({
    name: `${plugin.scaffold.name}`,
    value: plugin.name
});

module.exports = async ({ context }) => {
    const choices = Object.values(context.scaffoldPlugins.plugins).map(pluginToChoice);
    if (choices.length === 0) {
        throw new Error(
            "We couldn't find any scaffolding templates in webiny.root.js. Please add at least one!"
        );
    }

    const { selectedPluginName } = await inquirer.prompt({
        type: "list",
        name: "selectedPluginName",
        message: "Choose a template",
        choices
    });

    const { scaffold } = context.scaffoldPlugins.byName(selectedPluginName);
    const questions = scaffold.questions;

    const inqQuestions = typeof questions === "function" ? questions({ context }) : questions;

    const input = await inquirer.prompt(inqQuestions);
    const oraSpinner = ora().start(`Generating template...\n`);

    try {
        await scaffold.generate({ input, context, oraSpinner });
        oraSpinner.succeed("Done!");
    } catch (e) {
        oraSpinner.stop();
        console.log(e);
        process.exit(1);
    }
};
