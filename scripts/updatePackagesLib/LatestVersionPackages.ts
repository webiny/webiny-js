import execa from "execa";
import semver from "semver";
import type { IBasicPackage, IVersionedPackage } from "./types";

export interface IGetUpdatableParams {
    packages: IBasicPackage[];
    isPackageExcluded: (name: string) => boolean;
}

export class LatestVersionPackages {
    private readonly cache: WeakMap<IBasicPackage[], IVersionedPackage[]> = new WeakMap();

    public async getUpdatable(params: IGetUpdatableParams): Promise<IVersionedPackage[]> {
        const { isPackageExcluded } = params;

        const targetPackages = params.packages.filter(pkg => {
            return !isPackageExcluded(pkg.name);
        });
        const cache = this.cache.get(targetPackages);
        if (cache) {
            return cache;
        }

        const results: IVersionedPackage[] = [];
        await Promise.allSettled(
            targetPackages.map(async pkg => {
                try {
                    const result = await execa("npm", ["show", pkg.name, "version"]);
                    if (!result.stdout) {
                        console.log(`Could not find "${pkg.name}" latest version on npm.`);
                        return;
                    }
                    const npmPackageVersion = semver.coerce(result.stdout);
                    if (!npmPackageVersion) {
                        console.log(
                            `Could not coerce "${pkg.name}" latest version "${result.stdout}" from npm.`
                        );
                        return;
                    }
                    if (semver.gte(pkg.version, npmPackageVersion)) {
                        return;
                    }

                    results.push({
                        ...pkg,
                        latestVersion: npmPackageVersion
                    });
                } catch (ex) {
                    console.error(`Could not find "${pkg.name}" latest version on npm.`, ex);
                }
            })
        );

        this.cache.set(targetPackages, results);
        return results;
    }

    public static async create() {
        return new LatestVersionPackages();
    }
}
