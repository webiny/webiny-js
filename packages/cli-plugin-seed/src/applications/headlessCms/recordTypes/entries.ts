import { CliCommandSeedHeadlessCmsRecordType } from "~/plugins/CliCommandSeedHeadlessCmsRecordType";
import { CliCommandSeedHeadlessCmsEntryType } from "~/plugins/CliCommandSeedHeadlessCmsEntryType";
import { CliSeedContext } from "~/types";
import { getEntryTypeContextPlugins } from "~/applications/headlessCms/entryTypes/entryTypeContextPlugins";
import { processEntries } from "./entries/processEntries";

export const createEntriesRecordType = (context: CliSeedContext) => {
    const entryTypePlugins = getEntryTypeContextPlugins(context);

    const getEntryTypePlugin = (id: string): CliCommandSeedHeadlessCmsEntryType | null => {
        return entryTypePlugins.find(plugin => plugin.getId() === id);
    };

    return new CliCommandSeedHeadlessCmsRecordType({
        name: "Entries",
        recordType: "entries",
        questions: [
            {
                message: "Which kind of entries do you want generated?",
                name: "entryTypes",
                type: "checkbox",
                choices: entryTypePlugins.map(entryType => {
                    return {
                        name: entryType.getName(),
                        value: entryType.getId(),
                        short: entryType.getName(),
                        disabled: false
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
                        short: "First",
                        value: "first",
                        disabled: false,
                        checked: true
                    },
                    {
                        name: "Last",
                        short: "Last",
                        value: "last",
                        disabled: false,
                        checked: false
                    },
                    {
                        name: "Random",
                        short: "Random",
                        value: "random",
                        disabled: false,
                        checked: false
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
        ],
        process: async params => {
            return processEntries(params);
        }
    });
};
