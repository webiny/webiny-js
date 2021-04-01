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
        message: "Pick a template to scaffold",
        choices
    });

    const { scaffold } = context.plugins.byName<CliCommandScaffoldTemplate>(selectedPluginName);
    const questions = scaffold.questions;

    const inqQuestions = typeof questions === "function" ? questions({ context }) : questions;

    const input = await inquirer.prompt(inqQuestions);
    const oraSpinner = ora().start(`Generating template...\n`);

    try {
        await scaffold.generate({ input, context, wait, oraSpinner });
        oraSpinner.succeed("Done!");

        if (typeof scaffold.onSuccess === "function") {
            await scaffold.onSuccess({ input, context, wait, oraSpinner });
        }
    } catch (e) {
        oraSpinner.stop();
        if (typeof scaffold.onError === "function") {
            await scaffold.onError({ input, context, wait, oraSpinner, error: e });
        } else {
            console.log(e);
        }
        process.exit(1);
    }
};
