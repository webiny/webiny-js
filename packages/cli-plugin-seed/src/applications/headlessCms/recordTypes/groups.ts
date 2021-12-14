import lodashCamelCase from "lodash/camelCase";
import {
    CliCommandSeedHeadlessCmsRecordType,
    ProcessParams
} from "~/plugins/CliCommandSeedHeadlessCmsRecordType";
import { CliSeedContext } from "~/types";
import { chance } from "~/utils/chance";
import { createGroup } from "./groups/createGroup";

const WARNING_VALUE = 100;

const processGroups = async (params: ProcessParams) => {
    const { client, answers, log } = params;
    const { groups } = answers;
    let current = 1;

    const slugs: string[] = [];

    while (current <= groups) {
        const name = chance().profession();
        const slug = lodashCamelCase(name).toLowerCase();
        if (slugs.includes(name) === true) {
            continue;
        }
        slugs.push(slug);

        const result = await createGroup({
            log,
            client,
            name
        });
        if (!result) {
            return;
        }
        current++;
    }
};

// eslint-disable-next-line
export const createGroupsRecordType = (_: CliSeedContext) => {
    return new CliCommandSeedHeadlessCmsRecordType({
        name: "Groups",
        recordType: "groups",
        questions: [
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
                message: answers => {
                    const { groups } = answers;
                    return `Are you sure that you want to create ${groups} groups?`;
                },
                name: "groupsConfirm",
                type: "confirm",
                default: false,
                when: answers => {
                    const { groups } = answers;
                    return groups >= WARNING_VALUE;
                }
            }
        ],
        process: processGroups
    });
};
