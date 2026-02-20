import { loadJsonFileSync } from "load-json-file";
import type { IBasicPackage, PackageJson } from "./types";
import path from "path";
import fs from "fs";
import semver from "semver";

export interface IBasicPackageParams {
    packages: string[];
    matching: RegExp;
}

interface IFindPackagesParams {
    collection: IBasicPackage[];
    json: PackageJson;
    matching: RegExp;
}

const types = ["dependencies", "devDependencies", "peerDependencies"] as const;

export class BasicPackages {
    public readonly packages: IBasicPackage[];

    private constructor(packages: IBasicPackage[]) {
        this.packages = packages;
    }

    public static async create(params: IBasicPackageParams): Promise<BasicPackages> {
        const { packages, matching } = params;
        const results = packages.reduce<IBasicPackage[]>((collection, pkg) => {
            const target = path.resolve(pkg, "package.json");
            if (!fs.existsSync(target)) {
                console.log(`File not found: ${target}`);
                return collection;
            }
            const json = loadJsonFileSync<PackageJson>(target);
            return BasicPackages.findPackages({
                collection,
                json,
                matching
            });
        }, []);

        return new BasicPackages(results);
    }

    private static findPackages(params: IFindPackagesParams): IBasicPackage[] {
        const { collection, json, matching } = params;
        return types.reduce<IBasicPackage[]>((packages, type) => {
            const deps = json[type];
            if (!deps) {
                return packages;
            }
            for (const name in deps) {
                if (name.match(matching) === null) {
                    continue;
                }
                const existing = packages.find(p => p.name === name);
                if (!existing) {
                    const version = semver.coerce(deps[name]);
                    if (!version) {
                        console.warn(`Could not coerce version "${deps[name]}" for ${name}`);
                        continue;
                    }
                    packages.push({
                        name,
                        version
                    });

                    continue;
                }
                const version = semver.coerce(deps[name]);
                if (!version) {
                    continue;
                }
                if (!semver.gt(existing.version, version)) {
                    continue;
                }
                existing.version = version;
            }

            return packages;
        }, Array.from(collection));
    }
}
