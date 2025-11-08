import { createImplementation } from "@webiny/di";
import { GetApp, GetProjectService, ListPackagesService } from "~/abstractions/index.js";
import fs from "fs";
import path from "path";
import glob from "fast-glob";

const globToRegex = (pattern: string) => {
    // Escape regex special chars except *
    const escaped = pattern.replace(/[-\/\\^$+?.()|[\]{}]/g, "\\$&");
    // Replace * with .*
    const regexStr = "^" + escaped.replace(/\*/g, ".*") + "$";
    return new RegExp(regexStr);
};

export class DefaultListPackagesService implements ListPackagesService.Interface {
    constructor(
        private getProjectService: GetProjectService.Interface,
        private getApp: GetApp.Interface
    ) {}

    async execute(params: ListPackagesService.Params) {
        if (!params.app && !params.whitelist) {
            throw new Error(`Either "whitelist" or "app" argument must be provided.`);
        }

        const { whitelist = [], ...restParams } = params;
        const project = this.getProjectService.execute();
        const app = restParams.app ? this.getApp.execute(restParams.app) : null;

        // List all packages in `packages` folder.
        const packagesFullList: ListPackagesService.Result = fs
            .readdirSync(project.paths.rootFolder.join("packages").toString())
            .map(name => {
                const pkgFolderPath = project.paths.rootFolder.join("/packages/", name).toString();

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

        if (whitelist.length) {
            const whitelistedPackages = whitelist
                .map(whitelistedPkgName => {
                    return whitelistedPkgName.split(",");
                })
                .flat()
                .map(whitelistedPkgName => whitelistedPkgName.trim())
                .map(whitelistedPkgName => {
                    return packagesFullList.filter(pkg => {
                        if (whitelistedPkgName.includes("*")) {
                            const re = globToRegex(whitelistedPkgName);
                            return re.test(pkg.name);
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
    dependencies: [GetProjectService, GetApp]
});
