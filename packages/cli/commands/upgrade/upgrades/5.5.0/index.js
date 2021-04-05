const { join } = require("path");
const fs = require("fs");
const { getProjectApplication } = require("../../../../utils");
const execa = require("execa");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");

module.exports = {
    name: "upgrade-5.5.0",
    type: "cli-upgrade",
    version: "5.5.0",
    canUpgrade() {
        return true;
    },
    async upgrade(options, context) {
        const { project, info, warning, success } = context;
        // 1. Rename `webiny.root.js` to `webiny.project.js`.
        info(
            `Renaming ${info.highlight("webiny.root.js")} to ${info.highlight(
                "webiny.project.js"
            )}...`
        );

        const webinyRootPath = join(project.root, "webiny.root.js");
        const webinyProjectPath = join(project.root, "webiny.project.js");
        if (fs.existsSync(webinyProjectPath)) {
            warning(`Could not rename - ${warning.highlight("webiny.project.js")} already exists.`);
        } else {
            fs.renameSync(webinyRootPath, webinyProjectPath);
            success(
                `Successfully renamed ${success.highlight("webiny.root.js")} to ${success.highlight(
                    "webiny.project.js"
                )}.`
            );
        }

        console.log(); // -------------------------------- NEW SECTION --------------------------------

        // Create `webiny.application.js` files
        info(`Creating ${info.highlight("webiny.application.js")} files...`);

        const projectApplications = ["api", "apps/admin", "apps/site", "apps/website"];
        for (let i = 0; i < projectApplications.length; i++) {
            let projectApplication;
            try {
                projectApplication = getProjectApplication({ cwd: projectApplications[i] });
            } catch {
                continue;
            }
            const applicationFilePath = join(projectApplication.root, "webiny.application.js");
            if (fs.existsSync(applicationFilePath)) {
                warning(
                    `Skipping creation of ${warning.highlight(
                        "webiny.application.js"
                    )} file in ${warning.highlight(
                        projectApplication.name
                    )} project application - already exists.`
                );
            } else {
                const from = join(
                    __dirname,
                    "templates",
                    "webinyApplication",
                    `${projectApplications[i]}/webiny.application.js`
                );

                const to = join(projectApplication.root, "webiny.application.js");

                fs.copyFileSync(from, to);

                projectApplication = getProjectApplication({ cwd: projectApplications[i] });
                success(
                    `Successfully created ${success.highlight(
                        "webiny.application.js"
                    )} in ${success.highlight(projectApplication.name)} project application.`
                );
            }
        }

        console.log(); // -------------------------------- NEW SECTION --------------------------------

        // 3. Add `watch` command to all packages within the API project application.
        info(
            `Adding ${info.highlight("watch")} command to all ${info.highlight(
                "webiny.config.js"
            )} and ${info.highlight("package.json")} files located within the ${info.highlight(
                "API"
            )} project application.`
        );

        let apiPackages;
        try {
            apiPackages = await execa("yarn", [
                "webiny",
                "ws",
                "list",
                "--folder",
                "api",
                "--json",
                "--with-path"
            ])
                .then(({ stdout }) => stdout)
                .then(JSON.parse)
                .then(Object.values);
        } catch {}

        info(`Found ${info.highlight(apiPackages.length)} packages.`);

        for (let i = 0; i < apiPackages.length; i++) {
            const packagePath = apiPackages[i];
            const packageJsonPath = join(packagePath, "package.json");
            const packageJson = loadJson.sync(packageJsonPath);
            info(info.highlight(packagePath));
            if (packageJson.scripts.watch) {
                warning(
                    `Skipped updating ${warning.highlight("package.json")} - ${warning.highlight(
                        "watch"
                    )} script already exists.`
                );
            } else {
                packageJson.scripts.watch = "yarn webiny run watch";
                writeJson.sync(packageJsonPath, packageJson);
                success(
                    `Updated ${warning.highlight("package.json")} - ${warning.highlight(
                        "watch"
                    )} script added.`
                );
            }

            const webinyConfigJsPath = join(packagePath, "webiny.config.js");
            const contents = fs.readFileSync(webinyConfigJsPath, "utf8");

            let map;
            for (const regex in WEBINY_CONFIG_JS_MAP) {
                if (webinyConfigJsPath.match(new RegExp(regex))) {
                    map = WEBINY_CONFIG_JS_MAP[regex];
                    break;
                }
            }

            if (contents.match(new RegExp(map.match))) {
                warning(
                    `Skipped updating ${warning.highlight(
                        "webiny.config.js"
                    )} - ${warning.highlight("watch")} command already exists.`
                );
            } else {
                const from = join(__dirname, "templates", "api", map.file);
                const to = join(packagePath, "webiny.config.js");
                fs.copyFileSync(from, to);

                success(
                    `Updated ${warning.highlight("webiny.config.js")} - ${warning.highlight(
                        "watch"
                    )} command added.`
                );
            }
        }

        console.log(); // -------------------------------- NEW SECTION --------------------------------

        // 4. Add the `watch` command to React apps in apps/admin and apps/website project applications.
        info(
            `Adding ${info.highlight("watch")} command to all ${info.highlight(
                "package.json"
            )} files located within the ${info.highlight("Admin Area")} and ${info.highlight(
                "Website"
            )} project application.`
        );

        let appsPackages;
        try {
            appsPackages = await execa("yarn", [
                "webiny",
                "ws",
                "list",
                "--folder",
                "apps/admin",
                "--folder",
                "apps/website",
                "--folder",
                "apps/site",
                "--json",
                "--with-path"
            ])
                .then(({ stdout }) => stdout)
                .then(JSON.parse)
                .then(Object.values);
        } catch {}

        info(`Found ${info.highlight(appsPackages.length)} packages.`);

        for (let i = 0; i < appsPackages.length; i++) {
            const packagePath = appsPackages[i];
            const packageJsonPath = join(packagePath, "package.json");
            const packageJson = loadJson.sync(packageJsonPath);
            if (!packageJson.scripts || !packageJson.scripts.start) {
                continue;
            }

            info(info.highlight(packagePath));
            if (packageJson.scripts.watch) {
                warning(
                    `Skipped updating ${warning.highlight("package.json")} - ${warning.highlight(
                        "watch"
                    )} script already exists.`
                );
            } else {
                packageJson.scripts.watch = packageJson.scripts.start;
                writeJson.sync(packageJsonPath, packageJson);
                success(
                    `Updated ${warning.highlight("package.json")} - ${warning.highlight(
                        "watch"
                    )} script added.`
                );
            }
        }

        console.log(); // -------------------------------- NEW SECTION --------------------------------

        // 4. Custom packages.
        // - add `webiny.config.js` with `build` and `watch` scripts.
        // - add `@webiny/cli` and `@webiny/project-utils` to `package.json` files
        // - replace existing `build` and `watch` commands with new ones
        info(
            `Adding ${info.highlight("watch")} command to all ${info.highlight(
                "webiny.config.js"
            )} and ${info.highlight("package.json")} files located within the ${info.highlight(
                "packages"
            )} folder.`
        );

        let customPackages;
        try {
            customPackages = await execa("yarn", [
                "webiny",
                "ws",
                "list",
                "--ignore-folder",
                "api",
                "--ignore-folder",
                "apps",
                "--json",
                "--with-path"
            ])
                .then(({ stdout }) => stdout)
                .then(JSON.parse)
                .then(Object.values);
        } catch {}

        info(`Found ${info.highlight(customPackages.length)} packages.`);

        for (let i = 0; i < customPackages.length; i++) {
            const packagePath = customPackages[i];
            const packageJsonPath = join(packagePath, "package.json");
            const packageJson = loadJson.sync(packageJsonPath);
            info(info.highlight(packagePath));

            const tsConfigPath = join(packagePath, "tsconfig.json");
            if (!fs.existsSync(tsConfigPath)) {
                continue;
            }

            if (!packageJson.scripts.build && packageJson.scripts.build.includes("babel")) {
                packageJson.scripts.build = "yarn webiny run build";
                success(
                    `Updated ${warning.highlight("package.json")} - ${warning.highlight(
                        "build"
                    )} script added.`
                );
            } else {
                warning(
                    `Skipped updating ${warning.highlight("package.json")} - ${warning.highlight(
                        "build"
                    )} script already exists.`
                );
            }

            if (!packageJson.scripts.watch && packageJson.scripts.watch.includes("babel")) {
                packageJson.scripts.watch = "yarn webiny run watch";
                success(
                    `Updated ${warning.highlight("package.json")} - ${warning.highlight(
                        "watch"
                    )} script added.`
                );
            } else {
                warning(
                    `Skipped updating ${warning.highlight("package.json")} - ${warning.highlight(
                        "watch"
                    )} script already exists.`
                );
            }

            writeJson.sync(packageJsonPath, packageJson);

            if (packageJson.scripts.postbuild) {
                warning(
                    `Detected ${warning.highlight(
                        "postbuild"
                    )} script. You might want to remove it since its no longer used by the new ${warning.highlight(
                        "build"
                    )} script`
                );
            }

            const webinyConfigJsPath = join(packagePath, "webiny.config.js");
            const contents = fs.readFileSync(webinyConfigJsPath, "utf8");

            let map;
            for (const regex in WEBINY_CONFIG_JS_MAP) {
                if (webinyConfigJsPath.match(new RegExp(regex))) {
                    map = WEBINY_CONFIG_JS_MAP[regex];
                    break;
                }
            }

            if (contents.match(new RegExp(map.match))) {
                warning(
                    `Skipped updating ${warning.highlight(
                        "webiny.config.js"
                    )} - ${warning.highlight("watch")} command already exists.`
                );
            } else {
                const from = join(__dirname, "templates", "api", map.file);
                const to = join(packagePath, "webiny.config.js");
                fs.copyFileSync(from, to);

                success(
                    `Updated ${warning.highlight("webiny.config.js")} - ${warning.highlight(
                        "watch"
                    )} command added.`
                );
            }
        }

        console.log(); // -------------------------------- NEW SECTION --------------------------------

        // Enabling logs (optional)
        // Add WEBINY_LOGS_FORWARD_URL to `api` and `headless-cms` functions
        // add `@webiny/handler-logs` package in `api` packages
    }
};

const WEBINY_CONFIG_JS_MAP = {
    "api/code/prerenderingService": {
        match: "return watchFunction\\(",
        file: "prerenderingService.webiny.config.js"
    },
    "api/code/fileManager/transform": {
        match: "watch: watchFunction",
        file: "fileManagerTransform.webiny.config.js"
    },
    ".*": {
        match: "watch: watchFunction",
        file: "default.webiny.config.js"
    }
};
