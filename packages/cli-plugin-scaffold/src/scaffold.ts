import ora from "ora";
import inquirer from "inquirer";
import chalk from "chalk";
import { CliCommandScaffoldTemplate } from "./types";
import { CliContext } from "@webiny/cli/types";

const wait = (ms?: number): Promise<void> => {
    return new Promise((resolve: () => void) => {
        setTimeout(resolve, ms || 1000);
    });
};

interface ScaffoldArgs {
    context: CliContext;
}

export const scaffold = async (args: ScaffoldArgs) => {
    const { context } = args;

    const scaffoldPlugins = context.plugins.byType<CliCommandScaffoldTemplate>(
        "cli-plugin-scaffold-template"
    );
    if (!scaffoldPlugins.length) {
        console.log(
            `🚨 We couldn't find any scaffolding plugins. Add plugins to your "webiny.js" file!`
        );
        process.exit(1);
    }

    const choices = scaffoldPlugins.map(plugin => {
        const { name, description } = plugin.scaffold;

        return {
            name: `${chalk.bold(name)}\n  ${description}\n`,
            short: name,
            value: plugin.name
        };
    });

    const { selectedPluginName } = await inquirer.prompt({
        type: "list",
        pageSize: 18,
        name: "selectedPluginName",
        message: "Choose a scaffold:",
        choices
    });

    const { scaffold } = context.plugins.byName<CliCommandScaffoldTemplate>(selectedPluginName);

    const questions =
        typeof scaffold.questions === "function"
            ? scaffold.questions({ context })
            : scaffold.questions;

    const input = await inquirer.prompt(questions);
    const oraInstance = ora();

    const callbackArgs = { input, context, wait, ora: oraInstance, inquirer };

    try {
        if (typeof scaffold.onGenerate === "function") {
            await scaffold.onGenerate(callbackArgs);
        }

        await scaffold.generate(callbackArgs);

        if (typeof scaffold.onSuccess === "function") {
            await scaffold.onSuccess(callbackArgs);
        }
    } catch (e) {
        oraInstance.stop();
        if (typeof scaffold.onError === "function") {
            await scaffold.onError({ ...callbackArgs, error: e });
        } else {
            console.log(e);
        }
        process.exit(1);
    }
};
