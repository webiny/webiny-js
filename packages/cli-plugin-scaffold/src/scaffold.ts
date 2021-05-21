import ora from "ora";
import inquirer from "inquirer";
import { CliCommandScaffoldTemplate } from "./types";
import { ContextInterface } from "@webiny/handler/types";

const wait = (ms?: number): Promise<void> => {
    return new Promise((resolve: () => void) => {
        setTimeout(resolve, ms || 1000);
    });
};

interface ScaffoldArgs {
    context: ContextInterface;
}

export const scaffold = async (args: ScaffoldArgs) => {
    const { context } = args;

    const scaffoldPlugins = context.plugins.byType<CliCommandScaffoldTemplate>(
        "cli-plugin-scaffold-template"
    );
    if (!scaffoldPlugins.length) {
        console.log(
            `🚨 We couldn't find any scaffolding plugins. Add plugins to your "webiny.project.js" file!`
        );
        process.exit(1);
    }

    const choices = Object.values(scaffoldPlugins).map(plugin => ({
        name: `${plugin.scaffold.name}`,
        value: plugin.name
    }));
    const { selectedPluginName } = await inquirer.prompt({
        type: "list",
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

        console.log("Scaffolding...");
        await scaffold.generate(callbackArgs);

        if (typeof scaffold.onSuccess === "function") {
            await scaffold.onSuccess(callbackArgs);
        }

        oraInstance.succeed("Done!");
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
