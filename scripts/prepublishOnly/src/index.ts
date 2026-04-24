// @ts-expect-error
import getYarnWorkspaces from "get-yarn-workspaces";
import { WebinyPackage } from "./WebinyPackage";
import { ReadmeGenerator } from "./generators/ReadmeGenerator";
import { LockedDepsGenerator } from "./generators/LockedDepsGenerator";
import { LicenseGenerator } from "./generators/LicenseGenerator";
import chalk from "chalk";
import fs from "fs";
import path from "path";

const packages = getYarnWorkspaces()
    .filter((workspacePath: string) => {
        const packageJsonPath = path.join(workspacePath, "package.json");
        return fs.existsSync(packageJsonPath);
    })
    .map((workspacePath: string) => {
        return new WebinyPackage(workspacePath);
    });

const generatorsRegistry = [LockedDepsGenerator, ReadmeGenerator, LicenseGenerator];

for (const pkg of packages) {
    if (pkg.isPrivate()) {
        continue;
    }

    console.log(chalk.cyan(pkg.getName()));

    for (const Generator of generatorsRegistry) {
        const generator = new Generator(pkg);
        await generator.generate();
    }

    console.log("");
}
