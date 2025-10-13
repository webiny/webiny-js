import path from "path";
import { AbstractGenerator } from "./AbstractGenerator";
import writeJson from "write-json-file";
import type { PackageJson } from "type-fest";
import findUp from "find-up";
import { sync } from "load-json-file";

export class LockedDepsGenerator extends AbstractGenerator {
    static override displayName = "Locked Deps Generator";
    override displayName = "Locked Deps Generator";

    private readonly ignoredPackages = ["@pulumi/pulumi", "@pulumi/aws"];

    async generate() {
        this.log("Locking dependencies...");

        const lockedPackageJson = this.webinyPackage.getPackageJson();
        const deps = ["dependencies", "devDependencies", "peerDependencies"] as const;

        for (const depKey of deps) {
            const dependencies = lockedPackageJson[depKey];

            if (!dependencies) {
                continue;
            }

            for (const key in dependencies) {
                this.assertExists(dependencies);

                const depVersion = dependencies[key] as string;
                if (this.ignoredPackages.includes(key)) {
                    continue;
                }

                if (key.startsWith("@webiny/")) {
                    dependencies[key] = depVersion.replace("^", "");
                    continue;
                }

                if (depVersion.startsWith("file:")) {
                    continue;
                }

                if (depVersion.startsWith("https:")) {
                    continue;
                }

                const resolvedVersion = this.resolvePackageVersion(key);

                if (resolvedVersion) {
                    const newDepValue = lockedPackageJson[depKey] || {};
                    newDepValue[key] = resolvedVersion;
                    lockedPackageJson[depKey] = newDepValue;
                } else {
                    console.log(`Failed to resolve`, dependencies[key]);
                }
            }
        }

        await writeJson(this.webinyPackage.paths.distPackageJsonFile, lockedPackageJson);
    }

    private assertExists(
        dependencies: PackageJson.Dependency | undefined
    ): asserts dependencies is PackageJson.Dependency {
        if (!dependencies) {
            throw new Error(`Dependencies are not an object!`);
        }
    }

    private resolvePackageVersion(packageName: string) {
        const searchPath = path.join("node_modules", packageName, "package.json");
        const packageJson = findUp.sync(searchPath, { cwd: this.webinyPackage.paths.rootFolder });
        if (packageJson) {
            const json = sync<PackageJson>(packageJson);
            return json?.version;
        }

        return undefined;
    }
}
