import { CliCommand } from "~/abstractions/index.js";
import { ProjectSdk } from "@webiny/project";

export const createEnvOption = <T extends { env?: string }>(
    overrides: Partial<CliCommand.OptionDefinition<T>> = {}
): CliCommand.OptionDefinition<T> => {
    return {
        name: "env",
        description: "Environment name (dev, prod, etc.)",
        type: "string",
        default: "dev",
        validation: params => {
            const p = params as any;
            const hasApp = p.app || (p.apps && p.apps.length > 0);
            if (hasApp && !p.env) {
                throw new Error("Environment name is required.");
            }
            return true;
        },
        ...overrides
    };
};

export const createVariantOption = <T extends { variant?: string }>(
    projectSdk: ProjectSdk,
    overrides: Partial<CliCommand.OptionDefinition<T>> = {}
): CliCommand.OptionDefinition<T> => {
    return {
        name: "variant",
        description: "Variant name",
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

export const createBaseAppOptions = <T extends { env?: string; variant?: string; region?: string }>(
    projectSdk: ProjectSdk,
    overrides: {
        env?: Partial<CliCommand.OptionDefinition<T>>;
        variant?: Partial<CliCommand.OptionDefinition<T>>;
        region?: Partial<CliCommand.OptionDefinition<T>>;
    } = {}
): CliCommand.OptionDefinition<T>[] => {
    return [
        createEnvOption(overrides.env),
        createVariantOption(projectSdk, overrides.variant),
        createRegionOption(projectSdk, overrides.region)
    ];
};
