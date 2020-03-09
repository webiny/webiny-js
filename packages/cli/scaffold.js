const inquirer = require("inquirer");
const execa = require("execa");
const { PluginsContainer } = require("@webiny/plugins");
const path = require("path");
const ora = require("ora");

const scaffoldContext = {
    packagesPath: "packages",
    apiPath: "api",
    appPath: "app",
    apiYaml: path.join("api", "serverless.yml"),
    appYaml: path.join("app", "serverless.yml")
};

module.exports = async () => {
    const pluginToChoice = plugin => ({
        name: `${plugin.scaffold.name}`,
        value: plugin.name
    });

    const oraSpinner = ora().start("Loading available plugins...");
    const scaffoldModulesNames = JSON.parse(
        (
            await execa("yarn", [
                "list",
                "--pattern=@webiny/cli-scaffold-*|webiny-cli-scaffold-*",
                "--depth=0",
                "--json"
            ])
        ).stdout
    ).data.trees.map(treeNode =>
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
    if (choices.length === 0)
        throw new Error(
            "Oddly, there are no available scaffold templates. This must be a coding oversight..."
        );
    const { selectedPluginName } = await inquirer.prompt({
        type: "list",
        name: "selectedPluginName",
        message: "Choose a template",
        choices
    });

    const selectedPlugin = scaffoldPlugins.byName(selectedPluginName);
    const questions =
        typeof selectedPlugin.scaffold.questions === "function"
            ? selectedPlugin.scaffold.questions({ context: scaffoldContext })
            : selectedPlugin.scaffold.questions;
    const input = await inquirer.prompt(questions);
    const souvenirs = ["🥓", "🥝", "🍕", "🍺", "🍓", "🍏", "🌈", "🍫"];
    const emoji = souvenirs[Math.floor(Math.random() * souvenirs.length)];
    oraSpinner.start(
        `Generating the template... Here's some ${emoji} to make the time pass faster!\n`
    );
    await selectedPlugin.scaffold.generate({ input, context: scaffoldContext });
    oraSpinner.stop();

    console.log(`Successfully scaffolded the template!`);
};
