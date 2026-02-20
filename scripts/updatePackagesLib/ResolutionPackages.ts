import type { IVersionedPackage, PackageJson } from "./types";
import loadJsonFile from "load-json-file";
import { writeJsonFileSync } from "write-json-file";
import execa from "execa";

export interface IResolutionPackagesParams {
    packages: IVersionedPackage[];
    path: string;
    skip: boolean;
}

export class ResolutionPackages {
    private readonly skip: boolean;
    private readonly packages: IVersionedPackage[];
    private readonly path: string;
    private addedToResolutions: IVersionedPackage[] | undefined;

    private constructor(params: IResolutionPackagesParams) {
        this.skip = params.skip;
        this.path = params.path;
        this.packages = params.packages;
    }

    public static async create(params: IResolutionPackagesParams): Promise<ResolutionPackages> {
        return new ResolutionPackages(params);
    }

    public async addToPackageJson(): Promise<void> {
        if (this.skip) {
            return;
        } else if (this.addedToResolutions) {
            throw new Error(`Cannot execute addToPackageJson() twice.`);
        }
        this.addedToResolutions = [];
        const rootPackageJson = loadJsonFile.sync<PackageJson>(this.path);
        for (const pkg of this.packages) {
            if (!rootPackageJson.resolutions) {
                rootPackageJson.resolutions = {};
            }
            if (!rootPackageJson.resolutions[pkg.name]) {
                rootPackageJson.resolutions[pkg.name] = `^${pkg.latestVersion.raw}`;
                this.addedToResolutions.push(pkg);
            }
            if (!rootPackageJson.devDependencies) {
                rootPackageJson.devDependencies = {};
            }
            if (rootPackageJson.devDependencies[pkg.name]) {
                continue;
            }
            rootPackageJson.devDependencies[pkg.name] = `^${pkg.latestVersion.raw}`;
        }
        writeJsonFileSync(this.path, rootPackageJson);
        await execa("yarn");
    }

    public async removeFromPackageJson(): Promise<void> {
        if (this.skip || !this.addedToResolutions?.length) {
            return;
        }
        const rootPackageJsonUp = loadJsonFile.sync<PackageJson>(this.path);
        if (!rootPackageJsonUp.resolutions) {
            return;
        }
        for (const pkg of this.packages) {
            delete rootPackageJsonUp.resolutions[pkg.name];
        }
        writeJsonFileSync(this.path, rootPackageJsonUp);
    }
}
