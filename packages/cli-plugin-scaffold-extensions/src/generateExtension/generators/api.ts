import { addPluginToApiApp } from "./utils/addPluginToApiApp";
import { PluginGenerator } from "~/types";
import path from "path";
import readJson from "load-json-file";
import { PackageJson } from "@webiny/cli-plugin-scaffold/types";
import writeJson from "write-json-file";
import chalk from "chalk";
import {EXTENSIONS_ROOT_FOLDER} from "~/utils/constants";

export const apiGenerator: PluginGenerator = async ({ input }) => {
    await addPluginToApiApp(input);

    // Update dependencies list in package.json.
    const packageJsonPath = path.join("apps", "api", "graphql", "package.json");
    const packageJson = await readJson<PackageJson>(packageJsonPath);
    if (!packageJson.dependencies) {
        packageJson.dependencies = {};
    }

    packageJson.dependencies[input.packageName] = "1.0.0";

    await writeJson(packageJsonPath, packageJson);

    let { location: extensionsFolderPath } = input;
    if (!extensionsFolderPath) {
        extensionsFolderPath = `${EXTENSIONS_ROOT_FOLDER}/${input.name}`;
    }

    const watchCommand = `yarn webiny watch api --env dev`;
    const indexTsxFilePath = `${extensionsFolderPath}/src/index.ts`;

    return {
        nextSteps: [
            `run ${chalk.green(watchCommand)} to start a new local development session`,
            `open ${chalk.green(indexTsxFilePath)} and start coding`
        ]
    };
};
