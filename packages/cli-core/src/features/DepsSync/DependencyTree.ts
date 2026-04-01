import semver from "semver";
import type {
    IDependency,
    IDependencyTree,
    IDependencyTreePushParams,
    IReference
} from "./types.js";
import { PackageType } from "./types.js";

const keys = [
    PackageType.dependencies,
    PackageType.devDependencies,
    PackageType.peerDependencies,
    PackageType.resolutions
];

interface IAddReferenceParams {
    name: string;
    version: string;
    file: string;
    type: PackageType;
}

interface ISortItem {
    name: string;
}

const sortByName = (a: ISortItem, b: ISortItem) => {
    return a.name.localeCompare(b.name);
};

export class DependencyTree implements IDependencyTree {
    private readonly packages: Record<(typeof keys)[number], IDependency[]> = {
        resolutions: [],
        dependencies: [],
        devDependencies: [],
        peerDependencies: []
    };
    public readonly references: IReference[] = [];

    public get dependencies(): IDependency[] {
        return this.packages.dependencies.sort(sortByName);
    }

    public get devDependencies(): IDependency[] {
        return this.packages.devDependencies.sort(sortByName);
    }

    public get peerDependencies(): IDependency[] {
        return this.packages.peerDependencies.sort(sortByName);
    }

    public get resolutions(): IDependency[] {
        return this.packages.resolutions.sort(sortByName);
    }

    public get duplicates(): IReference[] {
        return this.references
            .filter(reference => {
                return reference.versions.length > 1;
            })
            .sort(sortByName);
    }

    public push(params: IDependencyTreePushParams): void {
        const { file, json, ignore } = params;
        for (const key of keys) {
            const dependencies = json[key];
            if (!dependencies) {
                continue;
            }

            for (const name in dependencies) {
                if (ignore && name.match(ignore) !== null) {
                    continue;
                }
                let version = dependencies[name];
                if (!version) {
                    continue;
                }

                const semverVersion =
                    semver.validRange(version) || version === "beta" ? version : null;
                if (!semverVersion) {
                    process.env.DEBUG === "true" &&
                        console.debug(
                            `${version} is not a valid SemVer value in ${file}, package ${name}.`
                        );
                    continue;
                }
                /**
                 * Let's skip if version starts with >= or <=, as those are not exact versions and we can't be sure which version is actually used.
                 */
                if (version.startsWith(">=") || version.startsWith("<=")) {
                    process.env.DEBUG === "true" &&
                        console.debug(
                            `${version} is not an exact version in ${file}, package ${name}. Skipping.`
                        );
                    continue;
                }

                version = version
                    .replace(/\^/g, "")
                    .replace(/~/g, "")
                    .replace(/>/g, "")
                    .replace(/</g, "")
                    .replace(/=/g, "");
                const existing = this.packages[key].find(item => {
                    return item.name === name && item.version === version;
                });
                if (existing) {
                    existing.files.push(file);
                    this.addReference({
                        name,
                        version,
                        file,
                        type: key
                    });
                    continue;
                }

                this.packages[key].push({
                    name,
                    version,
                    files: [file]
                });
                this.addReference({
                    name,
                    version,
                    file,
                    type: key
                });
            }
        }
    }

    private addReference(ref: IAddReferenceParams): void {
        const existing = this.references.find(item => {
            return item.name === ref.name;
        });
        const types = [ref.type];
        if (!existing) {
            this.references.push({
                name: ref.name,
                versions: [
                    {
                        version: ref.version,
                        files: [
                            {
                                file: ref.file,
                                types
                            }
                        ]
                    }
                ]
            });
            return;
        }
        const existingVersion = existing.versions.find(item => {
            return item.version === ref.version;
        });
        if (!existingVersion) {
            existing.versions.push({
                version: ref.version,
                files: [
                    {
                        file: ref.file,
                        types
                    }
                ]
            });
            return;
        }
        const existingFile = existingVersion.files.find(item => {
            return item.file === ref.file;
        });
        if (!existingFile) {
            existingVersion.files.push({
                file: ref.file,
                types
            });
            return;
        } else if (existingFile.types.includes(ref.type)) {
            return;
        }
        existingFile.types.push(ref.type);
    }
}
