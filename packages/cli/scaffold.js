const inquirer = require("inquirer");
const execa = require("execa");
const { PluginsContainer } = require("@webiny/plugins");
const path = require("path");

const scaffoldContext = {
    apiPath: "api",
    appPath: "app",
    apiYaml: path.join("api", "serverless.yml"),
    appYaml: path.join("app", "serverless.yml")
};

module.exports = async () => {
    const pluginToChoice = plugin => ({
        name: `${plugin.scaffold.name} - ${plugin.scaffold.description}`,
        value: plugin.name
    });

    const scaffoldModulesNames = JSON.parse(
        (
            await execa(
                'yarn list --pattern="@webiny/cli-scaffold-*|webiny-cli-scaffold-*" --depth=0 --json'
            )
        ).stdout
    ).data.trees.map(treeNode =>
        treeNode.name
            .split("@")
            .slice(0, -1) // Remove the trailing version tag
            .join("@")
    );
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
        message: "Pick the template you'd like to employ",
        choices
    });

    const selectedPlugin = scaffoldPlugins.byName(selectedPluginName);
    const input = await inquirer.prompt(selectedPlugin.scaffold.questions);
    selectedPlugin.scaffold.generate({ input, context: scaffoldContext });
};
