// @ts-expect-error
import getYarnWorkspaces from "get-yarn-workspaces";
import { blueBright, gray } from "chalk";
import fs from "fs-extra";
import get from "lodash/get";
import path from "path";
import loadJson from "load-json-file";
import writeJson from "write-json-file";
import { PackageJson } from "type-fest";
import { resolvePackageVersion } from "./resolvePackageVersion";

class FileLocker {
    private readonly file: string;
    private readonly ignoredPackages = ["@pulumi/pulumi", "@pulumi/aws"];

    constructor(file: string) {
        this.file = file;
    }

    async lockDependencies() {
        console.log(`Lock deps in ${blueBright(this.maskRoot(this.file))}`);
        const lockPackageJson = await loadJson<PackageJson>(this.file);
        const deps = ["dependencies", "devDependencies"] as const;

        for (const depKey of deps) {
            const dependencies = lockPackageJson[depKey];

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

                const resolvedVersion = resolvePackageVersion(key, {
                    cwd: path.dirname(this.file)
                });

                if (resolvedVersion) {
                    const newDepValue = lockPackageJson[depKey] || {};
                    newDepValue[key] = resolvedVersion;
                    lockPackageJson[depKey] = newDepValue;
                } else {
                    console.log(`Failed to resolve`, dependencies[key]);
                }
            }
        }

        await writeJson(this.file, lockPackageJson);
    }

    private maskRoot(filePath: string) {
        return filePath.replace(process.cwd(), gray("<projectRoot>"));
    }

    private assertExists(
        dependencies: PackageJson.Dependency | undefined
    ): asserts dependencies is PackageJson.Dependency {
        if (!dependencies) {
            throw new Error(`Dependencies are not an object!`);
        }
    }
}

class PackageLoader {
    async getPackageJsons() {
        const whitelist = path.resolve("packages");
        const packages = (getYarnWorkspaces() as string[])
            .map(pkg => pkg.replace(/\//g, path.sep))
            .reduce<string[]>((acc, pkg) => {
                if (pkg.startsWith(whitelist)) {
                    acc.push(pkg);
                }
                return acc;
            }, []);

        const packageJsons: string[] = [];

        for (const packageRoot of packages) {
            const packageJson = path.resolve(packageRoot, "package.json");
            if (!fs.existsSync(packageJson)) {
                continue;
            }

            const pkg = require(packageJson);

            if (pkg.private) {
                continue;
            }

            const distDirectoryName = get(pkg, "publishConfig.directory");
            const distDirectory = path.resolve(packageRoot, distDirectoryName);

            const distPackageJson = path.join(distDirectory, "package.json");

            // Copy package.json only if dist directory is different from package root
            if (distDirectoryName !== ".") {
                if (fs.existsSync(distPackageJson)) {
                    await fs.unlink(distPackageJson);
                }

                await fs.copyFile(packageJson, distPackageJson);
            }

            packageJsons.push(distPackageJson);
        }

        return packageJsons;
    }
}

const extraFiles: string[] = [
    "packages/cwp-template-aws/template/ddb/dependencies.json",
    "packages/cwp-template-aws/template/ddb-es/dependencies.json",
    "packages/cwp-template-aws/template/ddb-os/dependencies.json",
    "packages/cwp-template-aws/template/ddb/apps/api/graphql/package.json",
    "packages/cwp-template-aws/template/ddb-es/apps/api/graphql/package.json",
    "packages/cwp-template-aws/template/ddb-os/apps/api/graphql/package.json",
    "packages/cwp-template-aws/template/common/apps/admin/package.json",
    "packages/cwp-template-aws/template/common/extensions/theme/package.json",
    "packages/cwp-template-aws/template/common/apps/website/package.json"
];

export const prepublishOnly = async () => {
    const packageLoader = new PackageLoader();
    const packageJsons = await packageLoader.getPackageJsons();
    const filesToLock = [
        ...packageJsons,
        ...extraFiles.map(filePath => path.join(process.cwd(), filePath))
    ];

    for (const file of filesToLock) {
        const locker = new FileLocker(file);
        await locker.lockDependencies();
    }
};
