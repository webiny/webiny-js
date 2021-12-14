import {
    CliCommandSeedHeadlessCmsRecordType,
    ProcessParams
} from "~/plugins/CliCommandSeedHeadlessCmsRecordType";
import { CliSeedContext } from "~/types";
import lodashCamelCase from "lodash/camelCase";
import { createGroup } from "./groups/createGroup";
import { chance } from "~/utils/chance";
import { createModel } from "./models/createModel";
import { modelBuilderFactory } from "~/applications/headlessCms/builders/modelBuilderFactory";

const WARNING_VALUE = 100;

const processModels = async (params: ProcessParams) => {
    const { answers, log, client } = params;
    const { models, modelsGroupName } = answers;
    if (!models || models < 1) {
        log.red(`Answer "models" is not a number or less than one.`);
        return;
    }

    const group = await createGroup({
        client,
        name: modelsGroupName,
        log
    });
    if (!group) {
        return;
    }

    const modelIdList: string[] = [];
    let current = 1;
    while (current <= models) {
        const name = `${chance().first()} ${chance().last()}`;
        const modelId = lodashCamelCase(name);
        if (modelIdList.includes(modelId) === true) {
            continue;
        }
        modelIdList.push(modelId);

        const builder = modelBuilderFactory({
            modelId,
            name,
            description: `${name}/${modelId}`,
            group: group
        });

        const result = await createModel({
            ...params,
            builder
        });
        if (!result) {
            return;
        }
        current++;
    }
};

// eslint-disable-next-line
export const createModelsRecordType = (_: CliSeedContext) => {
    return new CliCommandSeedHeadlessCmsRecordType({
        name: "Models",
        recordType: "models",
        questions: [
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
                message: answers => {
                    const { models } = answers;
                    return `Are you sure that you want to create ${models} models?`;
                },
                name: "modelsConfirm",
                type: "confirm",
                default: false,
                when: answers => {
                    const { models } = answers;
                    return models >= WARNING_VALUE;
                }
            },
            {
                message: "Which group do you want us to generate models in?",
                name: "modelsGroup",
                type: "list",
                choices: [
                    {
                        name: "Random generated group",
                        short: "random",
                        value: "random",
                        checked: true,
                        disabled: false
                    },
                    {
                        name: "I will input a name",
                        short: "input",
                        value: "input",
                        checked: false,
                        disabled: false
                    }
                ]
            },
            {
                message: "Please input a group name:",
                name: "modelsGroupName",
                type: "input",
                validate: (input: string) => {
                    const value = lodashCamelCase(input || "");
                    if (!value || value.length < 5) {
                        return "Please type in at least 5 characters, spaces not included.";
                    }
                    return true;
                },
                when: answers => {
                    return answers.modelsGroup === "input";
                }
            }
        ],
        process: processModels
    });
};
