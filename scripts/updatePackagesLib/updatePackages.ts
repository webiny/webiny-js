import * as path from "path";
import { allWorkspaces } from "../../packages/project-utils/workspaces";
import { BasicPackages } from "./BasicPackages";
import { LatestVersionPackages } from "./LatestVersionPackages";
import { ResolutionPackages } from "./ResolutionPackages";
import { UpPackages } from "./UpPackages";
import type { IUserInputResponse } from "./getUserInput";
import { crateIsPackageExcluded } from "./crateIsPackageExcluded";

const getAllPackages = (): string[] => {
    const workspaces = allWorkspaces() as string[];
    const packages = workspaces.map(pkg => {
        return path.resolve(process.cwd(), pkg);
    });

    packages.push(path.resolve(process.cwd()));

    return packages;
};

export interface IUpdatePackagesParams {
    input: IUserInputResponse;
}

export const updatePackages = async (params: IUpdatePackagesParams) => {
    const { matching, skipResolutions, shouldUpdate } = params.input;
    /**
     * Basic packages container with all packages that match the regex and their versions in the package.json files.
     */
    const packages = await BasicPackages.create({
        packages: getAllPackages(),
        matching
    });
    /**
     * Versioned packages container.
     * All packages with latest versions
     */
    const latestVersionPackages = await LatestVersionPackages.create();

    const updatable = await latestVersionPackages.getUpdatable({
        packages: packages.packages,
        isPackageExcluded: crateIsPackageExcluded(params.input.exclude)
    });
    if (updatable.length === 0) {
        console.log("All packages are up-to-date. Exiting...");
        return;
    }
    console.log("Packages which have newer versions:");
    for (const pkg of updatable) {
        console.log(`${pkg.name}: ${pkg.version.raw} -> ${pkg.latestVersion.raw}`);
    }

    const isUpdating = await shouldUpdate();
    if (!isUpdating) {
        return;
    }

    const resolutions = await ResolutionPackages.create({
        skip: skipResolutions,
        path: path.resolve(process.cwd(), "package.json"),
        packages: updatable
    });

    await resolutions.addToPackageJson();

    const updatePackages = await UpPackages.create({
        packages: updatable,
        options: {
            useCaret: false
        }
    });

    await updatePackages.process();

    await resolutions.removeFromPackageJson();
};
