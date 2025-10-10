// @ts-expect-error
import getYarnWorkspaces from "get-yarn-workspaces";
import { WebinyPackage } from "./WebinyPackage";
import { ReadmeGenerator } from "./generators/ReadmeGenerator";
import { LockedDepsGenerator } from "./generators/LockedDepsGenerator";
import chalk from "chalk";

const packages = getYarnWorkspaces().map((path: string) => {
    return new WebinyPackage(path);
});

const Generators = [LockedDepsGenerator, ReadmeGenerator];

for (const pkg of packages) {
    if (pkg.isPrivate()) {
        continue;
    }

    console.log(chalk.cyan(pkg.getName()));

    for (const Generator of Generators) {
        const generator = new Generator(pkg);
        await generator.generate();
    }

    console.log("");
}
