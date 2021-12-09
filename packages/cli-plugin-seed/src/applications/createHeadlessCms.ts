import { CliCommandSeedApplication, Questions } from "~/plugins/CliCommandSeedApplication";
import { processHeadlessCms } from "./headlessCms/processHeadlessCms";
import { getEntryTypeContextPlugins } from "~/applications/headlessCms/entryTypes/getEntryTypeContextPlugins";
import { CliCommandSeedHeadlessCmsEntryType } from "~/plugins/CliCommandSeedHeadlessCmsEntryType";

const questions: Questions = params => {
    const { context } = params;

    const entryTypePlugins = getEntryTypeContextPlugins(context);

    const getEntryTypePlugin = (id: string): CliCommandSeedHeadlessCmsEntryType | null => {
        return entryTypePlugins.find(plugin => plugin.getId() === id);
    };
    return [
        {
            message: "Which kind of entries do you want generated?",
            name: "entryTypes",
            type: "checkbox",
            choices: entryTypePlugins.map(entryType => {
                return {
                    name: entryType.getName(),
                    value: entryType.getId()
                };
            }),
            validate: (input: string[]) => {
                if (!input || input.length === 0) {
                    return "You must choose at least one type of entry to be generated.";
                }
                for (const id of input) {
                    const plugin = getEntryTypePlugin(id);
                    if (!plugin) {
                        return `There is no entry type plugin with ID "${id}".`;
                    }
                    const validation = plugin.validate(input);
                    if (validation !== true) {
                        return validation;
                    }
                }
                return true;
            }
        },
        {
            message: "How many groups?",
            name: "groups",
            type: "number",
            default: 1,
            validate: (input: number) => {
                if (!input || isNaN(input) || input < 1) {
                    return "You must generate at least 1 group.";
                }
                return true;
            }
        },
        {
            message: "How many models?",
            name: "models",
            type: "number",
            default: 1,
            validate: (input: number) => {
                if (!input || isNaN(input) || input < 1) {
                    return "You must generate at least 1 model.";
                }
                return true;
            }
        },
        {
            message: "How many entries per model?",
            name: "entries",
            type: "number",
            default: 5,
            validate: (input: number) => {
                if (!input || isNaN(input) || input < 1) {
                    return "You must generate at least 1 entry.";
                }
                return true;
            }
        },
        {
            message: "How many revisions per entry?",
            name: "revisions",
            type: "number",
            default: 1,
            validate: (input: number) => {
                if (!input || isNaN(input) || input < 1) {
                    return "You must generate at least 1 entry version.";
                }
                return true;
            }
        },
        {
            message: "Publish generated entries?",
            name: "publish",
            type: "confirm",
            default: true
        },
        {
            message: "When publishing, which entry version should be published?",
            name: "publishRevision",
            type: "list",
            choices: [
                {
                    name: "First",
                    value: "first"
                },
                {
                    name: "Last",
                    value: "last"
                },
                {
                    name: "Random",
                    value: "random"
                }
            ],
            when: (answers: Record<string, any>) => {
                const { publish, revisions } = answers;
                if (revisions <= 1) {
                    return false;
                }
                return !!publish;
            }
        }
    ];
};

export const createHeadlessCms = () => {
    return new CliCommandSeedApplication({
        id: "headless-cms",
        name: "Headless CMS",
        questions,
        process: processHeadlessCms
    });
};
