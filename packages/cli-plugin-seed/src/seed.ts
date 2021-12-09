import inquirer from "inquirer";
import ora from "ora";
import { CliContext } from "@webiny/cli/types";
import { CliCommandSeedApplication } from "~/plugins/CliCommandSeedApplication";
import { getDefaultPlugins } from "~/applications";
import { PluginsContainer } from "@webiny/plugins/PluginsContainer";
import { createLogger } from "~/utils/logger";
import { CliCommandSeedRunArgs } from "~/types";
import { validateArguments } from "~/utils/validations";

export interface Applications {
    [key: string]: CliCommandSeedApplication;
}

export interface Params {
    context: CliContext;
    args: CliCommandSeedRunArgs;
}
export const seed = async (params: Params) => {
    const { context, args } = params;
    const log = createLogger();
    /**
     * We need to validate arguments and environment.
     */
    if (validateArguments({ context, args, log }) === false) {
        return;
    }

    const { expenses } = await inquirer.prompt({
        type: "confirm",
        name: "expenses",
        message:
            "Do you understand that running this tool will add additional usage cost into your account?"
    });
    if (!expenses) {
        return;
    }

    (context.plugins as PluginsContainer).register(getDefaultPlugins());

    const applications: Applications = context.plugins
        /**
         * First we find ours and user defined app plugins
         */
        .byType<CliCommandSeedApplication>(CliCommandSeedApplication.type)
        /**
         * And reverse so user define apps override our default ones.
         */
        .reverse()
        .reduce((apps, app: CliCommandSeedApplication) => {
            apps[app.getId()] = app;
            return apps;
        }, {});

    const choices = Object.values(applications)
        .map(app => {
            return {
                name: app.getName(),
                short: app.getName(),
                value: app.getId()
            };
        })
        .concat([
            {
                name: "None",
                short: "None",
                value: null
            }
        ]);

    const { app } = await inquirer.prompt({
        type: "list",
        name: "app",
        message: "Choose an app to seed:",
        choices
    });
    if (!app) {
        return;
    } else if (!applications[app]) {
        log.red(`There is no application with ID "${app}".`);
        return;
    }
    const application = applications[app];
    /**
     * Each of the applications must have questions
     */
    const questions = application.getQuestions({
        context
    });
    if (questions.length === 0) {
        log.red(`There are no questions in the application "${application}".`);
        return;
    }

    /**
     * Go through the list of questions required by the selected application.
     */
    const answers = await inquirer.prompt(questions);
    /**
     * If any of the answers is null, we stop the seed.
     */
    for (const key in answers) {
        if (answers[key] === null) {
            return;
        }
    }
    const oraInstance = ora();

    try {
        await application.process({
            context,
            ora: oraInstance,
            inquirer,
            answers,
            log
        });
        await application.onSuccess({
            context,
            ora: oraInstance,
            inquirer,
            answers,
            log
        });
    } catch (ex) {
        await application.onError({
            context,
            ora: oraInstance,
            inquirer,
            answers,
            error: ex,
            log
        });
    }
};
