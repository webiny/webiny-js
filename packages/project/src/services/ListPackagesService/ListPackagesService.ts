import { createImplementation } from "@webiny/di";
import { GetAppService, GetProjectService, ListPackagesService } from "~/abstractions/index.js";
import fs from "fs";
import path from "path";
import glob from "fast-glob";

const globToRegex = (pattern: string) => {
    // Escape regex special chars except *
    const escaped = pattern.replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&");
    // Replace * with .* in regex pattern
    const regexStr = "^" + escaped.replace(/\*/g, ".*") + "$";
    return new RegExp(regexStr);
};

const matchesGlobPattern = (packageName: string, pattern: string): boolean => {
    // Try matching with the full package name
    const regex = globToRegex(pattern);
    if (regex.test(packageName)) {
        return true;
    }

    // Also try matching against the name without @webiny/ or @app/ prefix
    const withoutPrefix = packageName.replace(/^@[^/]+\//, "");
    if (regex.test(withoutPrefix)) {
        return true;
    }

    // If pattern doesn't start with @, also try adding @webiny/ prefix to pattern
    if (!pattern.startsWith("@")) {
        const regexWithPrefix = globToRegex(`@webiny/${pattern}`);
        if (regexWithPrefix.test(packageName)) {
            return true;
        }
    }

    return false;
};

export class DefaultListPackagesService implements ListPackagesService.Interface {
    constructor(
        private getProjectService: GetProjectService.Interface,
        private getAppService: GetAppService.Interface
    ) {}

    async execute(params: ListPackagesService.Params) {
        if (!params.appName && !params.packageWhitelist) {
            throw new Error(`Either "packageWhitelist" or "appName" argument must be provided.`);
        }

        const { packageWhitelist = [], appName } = params;
        const project = this.getProjectService.execute();
        const app = appName ? this.getAppService.execute(appName) : null;

        // List all packages in `packages` folder.
        let packagesFullList: ListPackagesService.Result = [];

        const packagesFolderPath = project.paths.rootFolder.join("packages").toString();
        if (fs.existsSync(packagesFolderPath)) {
            packagesFullList = fs
                .readdirSync(project.paths.rootFolder.join("packages").toString())
                .map(name => {
                    const pkgFolderPath = project.paths.rootFolder
                        .join("/packages/", name)
                        .toString();

                    let webinyConfigPath = path.join(pkgFolderPath, "webiny.config.ts");
                    if (!fs.existsSync(webinyConfigPath)) {
                        webinyConfigPath = path.join(pkgFolderPath, "webiny.config.js");
                    }

                    return {
                        name: `@webiny/${name}`,
                        paths: {
                            packageFolder: pkgFolderPath,
                            webinyConfigFile: webinyConfigPath
                        }
                    } as ListPackagesService.Package;
                })
                .filter(Boolean);
        }

        if (app) {
            const webinyConfigPaths = glob.sync("**/webiny.config.@(ts|js)", {
                cwd: app.paths.workspaceFolder.toString(),
                absolute: true,
                ignore: ["**/node_modules/**", "**/dist/**"]
            });

            const appPackages = webinyConfigPaths.map(webinyConfigPath => {
                const packageFolderPath = path.dirname(webinyConfigPath);
                const packageName = path.basename(packageFolderPath);

                return {
                    name: `@${app.name}/${packageName}`,
                    paths: {
                        packageFolder: packageFolderPath,
                        webinyConfigFile: webinyConfigPath
                    }
                } as ListPackagesService.Package;
            });

            packagesFullList.push(...appPackages);
        }

        const packagesToWatch = [];

        if (packageWhitelist.length) {
            const whitelistedPackages = packageWhitelist
                .map(whitelistedPkgName => {
                    return whitelistedPkgName.split(",");
                })
                .flat()
                .map(whitelistedPkgName => whitelistedPkgName.trim())
                .map(whitelistedPkgName => {
                    return packagesFullList.filter(pkg => {
                        if (whitelistedPkgName.includes("*")) {
                            return matchesGlobPattern(pkg.name, whitelistedPkgName);
                        }

                        // We consider both `name` and `@webiny/name` as valid package names.
                        // The @webiny/ prefix is optional (makes it easier to type for us).
                        return (
                            pkg.name === whitelistedPkgName ||
                            pkg.name === `@webiny/${whitelistedPkgName}`
                        );
                    });
                })
                .flat()
                .filter(Boolean) as ListPackagesService.Result;

            packagesToWatch.push(...whitelistedPackages);
        }

        if (app) {
            // We've hardcoded this filtering here just because of lack of time.
            // With v5, these "presets" were located within `webiny.application.ts` files.
            if (app.name === "api") {
                packagesToWatch.push(
                    ...packagesFullList.filter(pkg => {
                        return pkg.name === "@api/graphql";
                    })
                );

                return packagesToWatch;
            }

            packagesToWatch.push(
                ...packagesFullList.filter(pkg => {
                    return pkg.name.startsWith(`@${app.name}`);
                })
            );
        }

        return packagesToWatch;
    }
}

export const listPackagesService = createImplementation({
    abstraction: ListPackagesService,
    implementation: DefaultListPackagesService,
    // TODO: move getApp into a service
    dependencies: [GetProjectService, GetAppService]
});
