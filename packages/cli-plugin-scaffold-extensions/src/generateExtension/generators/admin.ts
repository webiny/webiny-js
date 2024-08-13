import { addPluginToAdminApp } from "./utils/addPluginToAdminApp";
import { PluginGenerator } from "~/types";
import path from "path";
import readJson from "load-json-file";
import { PackageJson } from "@webiny/cli-plugin-scaffold/types";
import writeJson from "write-json-file";
import chalk from "chalk";

export const adminGenerator: PluginGenerator = async ({ input }) => {
    await addPluginToAdminApp(input);

    // Update dependencies list in package.json.
    const packageJsonPath = path.join("apps", "admin", "package.json");
    const packageJson = await readJson<PackageJson>(packageJsonPath);
    if (!packageJson.dependencies) {
        packageJson.dependencies = {};
    }

    packageJson.dependencies[input.packageName] = "1.0.0";

    await writeJson(packageJsonPath, packageJson);

    return {
        nextSteps: [
            `run ${chalk.green(
                "yarn webiny watch admin --env dev"
            )} to start a new local development session (restart existing one if already running)`
        ]
    };
};
