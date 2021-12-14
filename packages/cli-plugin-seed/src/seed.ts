import inquirer from "inquirer";
import ora from "ora";
import { CliCommandSeedApplication } from "~/plugins/CliCommandSeedApplication";
import { getDefaultPlugins } from "~/applications";
import { createLogger } from "~/utils/logger";
import { CliCommandSeedRunArgs, CliSeedContext } from "~/types";
import { validateArguments } from "~/utils/validations";

export interface Applications {
    [key: string]: CliCommandSeedApplication;
}

export interface Params {
    context: CliSeedContext;
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

    const prompt = inquirer.createPromptModule();
    /**
     * Users can skip warning if they chose to.
     */
    if (args.skipWarning !== true) {
        const { expenses } = await prompt({
            type: "confirm",
            name: "expenses",
            message:
                "Do you understand that running this tool will add additional usage cost into your account?"
        });
        if (!expenses) {
            return;
        }
    }

    context.plugins.register(getDefaultPlugins(context));

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

    const { app } = await prompt({
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
    const answers = await prompt(questions);
    /**
     * If any of the answers is null, we stop the seed.
     */
    for (const key in answers) {
        if (answers[key] === null) {
            return;
        }
    }
    const oraInstance = ora();

    log.yellow(`Processing ${application.getName()}...`);
    try {
        await application.process({
            context,
            ora: oraInstance,
            inquirer: prompt,
            answers,
            log
        });
        await application.onSuccess({
            context,
            ora: oraInstance,
            inquirer: prompt,
            answers,
            log
        });
        log.yellow("...done");
    } catch (ex) {
        log.red(`Error during processing...`);
        await application.onError({
            context,
            ora: oraInstance,
            inquirer: prompt,
            answers,
            error: ex,
            log
        });
    }
};
