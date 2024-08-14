import chalk from "chalk";

export type ExtensionTypesNextSteps = (params: { extensionFolderPath: string }) => string[];

export const extensionTypesNextSteps: Record<string, ExtensionTypesNextSteps> = {
    admin: ({ extensionFolderPath }) => {
        const entrypointFilePath = extensionFolderPath + "/src/index.tsx";
        return [
            `run ${chalk.green(
                "yarn webiny watch admin --env dev"
            )} to start a new local development session`,
            `open ${chalk.green(entrypointFilePath)} and start coding`
        ];
    },
    api: ({ extensionFolderPath }) => {
        const entrypointFilePath = extensionFolderPath + "/src/index.ts";
        return [
            `run ${chalk.green(
                "yarn webiny watch api --env dev"
            )} to start a new local development session`,
            `open ${chalk.green(entrypointFilePath)} and start coding`
        ];
    }
};
