import { CliCommandSeedApplication, Questions } from "~/plugins/CliCommandSeedApplication";
import Choice from "inquirer/lib/objects/choice";
import { CliSeedContext } from "~/types";
import { getRecordTypeContextPlugins } from "~/applications/headlessCms/recordTypes/recordTypeContextPlugins";
import { createArticleEntryType } from "~/applications/headlessCms/entryTypes/article";
import { createAuthorEntryType } from "~/applications/headlessCms/entryTypes/author";
import { createCategoryEntryType } from "~/applications/headlessCms/entryTypes/category";
import { createEntriesRecordType } from "~/applications/headlessCms/recordTypes/entries";
import { createGroupsRecordType } from "~/applications/headlessCms/recordTypes/groups";
import { createModelsRecordType } from "~/applications/headlessCms/recordTypes/models";
import { createHeadlessCmsManageClient } from "~/applications/graphQLClient";

const questions: Questions = params => {
    const { context } = params;

    context.plugins.register([
        createCategoryEntryType(context),
        createAuthorEntryType(context),
        createArticleEntryType(context)
    ]);
    context.plugins.register([
        createEntriesRecordType(context),
        createGroupsRecordType(context),
        createModelsRecordType(context)
    ]);

    const recordTypePlugins = getRecordTypeContextPlugins(context);

    const typesOfRecordsChoices: Choice[] = recordTypePlugins.map(recordType => {
        return {
            name: recordType.getName(),
            value: recordType.getRecordType(),
            short: recordType.getName(),
            disabled: false
        };
    });
    if (typesOfRecordsChoices.length === 0) {
        throw new Error("Missing record type choices in Headless CMS.");
    }

    const recordTypeQuestions = recordTypePlugins.reduce((questions, recordType) => {
        return questions.concat(recordType.getQuestions({ context }));
    }, []);

    return [
        {
            message: "Which kind of records do you want generated?",
            name: "recordType",
            type: "list",
            default: "group",
            choices: typesOfRecordsChoices,
            validate: (input: string) => {
                if (!input) {
                    return "You must choose which type of record do you want generated.";
                }
                return true;
            }
        }
    ].concat(recordTypeQuestions);
};

export const createHeadlessCms = (_: CliSeedContext) => {
    return new CliCommandSeedApplication({
        id: "headless-cms",
        name: "Headless CMS",
        questions,
        process: async (app, params) => {
            const { context, answers, log } = params;

            const { recordType } = answers;
            if (!recordType) {
                log.red(`[DEBUG] There is no recordType in answers.`);
                return;
            }

            const recordTypesPlugins = getRecordTypeContextPlugins(context);
            const recordTypePlugin = recordTypesPlugins.find(
                plugin => plugin.getRecordType() === recordType
            );
            if (!recordTypePlugin) {
                log.red(`[DEBUG] There is no record type plugin "${recordType}".`);
                return;
            }
            log.green(`[DEBUG] Processing Headless CMS plugin for "${recordType}".`);

            return recordTypePlugin.process({
                ...params,
                application: app,
                client: createHeadlessCmsManageClient({
                    url: "manageUrl"
                })
            });
        }
    });
};
