import type { IPreset, IPresetExclude } from "./createPreset";
import inquirer from "inquirer";

export interface IGetUserInputParams {
    presets: IPreset[];
}

export interface IUserInputResponse {
    shouldUpdate: () => Promise<boolean>;
    skipResolutions: boolean;
    matching: RegExp;
    useCaret: boolean;
    exclude: IPresetExclude | undefined;
}

export const getUserInput = async ({
    presets
}: IGetUserInputParams): Promise<IUserInputResponse | null> => {
    const prompt = inquirer.createPromptModule();

    const shouldUpdate = async () => {
        const { shouldUpdate } = await prompt({
            name: "shouldUpdate",
            type: "confirm",
            default: false,
            message: "Do you want to update the packages?"
        });
        return !!shouldUpdate;
    };

    const { preset } = await prompt({
        name: "preset",
        message: "Do you want to use a preset?",
        default: null,
        type: "list",
        choices: [
            { name: "I will write my own custom matching", value: null },

            ...presets.map(p => {
                return {
                    name: p.name,
                    value: p.name
                };
            })
        ]
    });
    if (preset) {
        const matching = presets.find(p => p.name === preset);
        if (!matching) {
            throw new Error(`Preset not found: ${preset}`);
        }
        return {
            ...matching,
            useCaret: matching.caret || true,
            shouldUpdate,
            exclude: matching.exclude
        };
    }

    const { matching } = await prompt({
        name: "matching",
        type: "input",
        message: "Enter a regex to match package names.",
        validate(input: string) {
            try {
                if (!input || input.length < 3) {
                    return "Please enter a regex.";
                }
                new RegExp(input);
                return true;
            } catch (ex) {
                console.error(ex);
                return `Invalid regex: ${input}`;
            }
        }
    });

    const { skipResolutions } = await prompt({
        name: "skipResolutions",
        type: "list",
        default: null,
        message: "Skip adding packages to main package.json resolutions?",
        choices: [
            { name: "No", value: false },
            { name: "Yes", value: true }
        ]
    });

    const { useCaret } = await prompt({
        name: "useCaret",
        type: "list",
        default: null,
        message: "Use caret (^) to match any package in the major version?",
        choices: [
            { name: "No", value: false },
            { name: "Yes", value: true }
        ]
    });

    return {
        useCaret,
        matching,
        shouldUpdate,
        skipResolutions,
        exclude: undefined
    };
};
