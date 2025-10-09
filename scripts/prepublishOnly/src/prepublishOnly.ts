// @ts-expect-error
import getYarnWorkspaces from "get-yarn-workspaces";
import { WebinyPackage } from "./WebinyPackage";
import { ReadmeGenerator } from "./generators/ReadmeGenerator";
import { LockedDepsGenerator } from "./generators/LockedDepsGenerator";

export const prepublishOnly = async () => {
    const packages = getYarnWorkspaces().map((path: string) => {
        return new WebinyPackage(path);
    });

    const Generators = [LockedDepsGenerator, ReadmeGenerator];

    for (const pkg of packages) {
        if (pkg.isPrivate()) {
            continue;
        }

        for (const Generator of Generators) {
            const generator = new Generator(pkg);
            await generator.generate();
        }
    }
};
