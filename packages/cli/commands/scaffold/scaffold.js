const inquirer = require("inquirer");
const execa = require("execa");
const { PluginsContainer } = require("@webiny/plugins");
const ora = require("ora");

const pluginToChoice = plugin => ({
    name: `${plugin.scaffold.name}`,
    value: plugin.name
});

module.exports = async ({ context }) => {
    const oraSpinner = ora().start("Loading available plugins...");
    const { stdout } = await execa("yarn", [
        "list",
        "--pattern=@webiny/cli-scaffold-*|webiny-cli-scaffold-*",
        "--depth=0",
        "--json"
    ]);

    const scaffoldModulesNames = JSON.parse(stdout).data.trees.map(treeNode =>
        treeNode.name
            .split("@")
            .slice(0, -1) // Remove the trailing version tag
            .join("@")
    );
    oraSpinner.stop();

    const scaffoldPlugins = new PluginsContainer(
        scaffoldModulesNames.map(crtModuleName => require(crtModuleName))
    );

    const choices = Object.values(scaffoldPlugins.plugins).map(pluginToChoice);

    if (choices.length === 0) {
        throw new Error("We couldn't find any scaffolding templates.");
    }

    const { selectedPluginName } = await inquirer.prompt({
        type: "list",
        name: "selectedPluginName",
        message: "Choose a template",
        choices
    });

    const { scaffold } = scaffoldPlugins.byName(selectedPluginName);
    const questions = scaffold.questions;

    const inqQuestions = typeof questions === "function" ? questions({ context }) : questions;

    const input = await inquirer.prompt(inqQuestions);
    oraSpinner.start(`Generating template...\n`);

    try {
        await scaffold.generate({ input, context, oraSpinner });
        oraSpinner.succeed("Done!");
    } catch (e) {
        oraSpinner.stop();
        console.log(e);
        process.exit(1);
    }
};
