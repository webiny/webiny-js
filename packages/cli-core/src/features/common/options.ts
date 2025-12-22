import { CliCommand } from "~/abstractions/index.js";
import { ProjectSdk } from "@webiny/project";

export const createEnvOption = <T>(
    overrides: Partial<CliCommand.OptionDefinition<T>> = {}
): CliCommand.OptionDefinition<T> => {
    return {
        name: "env",
        description: "Environment name (dev, prod, etc.)",
        type: "string",
        default: "dev",
        ...overrides
    };
};

export const createVariantOption = <T extends { variant?: string }>(
    projectSdk: ProjectSdk,
    overrides: Partial<CliCommand.OptionDefinition<T>> = {}
): CliCommand.OptionDefinition<T> => {
    return {
        name: "variant",
        description: "Variant of the app",
        type: "string",
        validation: params => {
            const isValid = projectSdk.isValidVariantName(params.variant);
            if (isValid.isErr()) {
                throw isValid.error;
            }
            return true;
        },
        ...overrides
    };
};

export const createRegionOption = <T extends { region?: string }>(
    projectSdk: ProjectSdk,
    overrides: Partial<CliCommand.OptionDefinition<T>> = {}
): CliCommand.OptionDefinition<T> => {
    return {
        name: "region",
        description: "Region to target",
        type: "string",
        validation: params => {
            const isValid = projectSdk.isValidRegionName(params.region);
            if (isValid.isErr()) {
                throw isValid.error;
            }
            return true;
        },
        ...overrides
    };
};
