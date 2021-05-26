const { join } = require("path");
const fs = require("fs");
const util = require("util");
const { getProjectApplication } = require("../../../../utils");
const execa = require("execa");
const loadJson = require("load-json-file");
const writeJson = require("write-json-file");
const prettier = require("prettier");
const ncpBase = require("ncp");
const ncp = util.promisify(ncpBase.ncp);
const rimraf = require("rimraf");

module.exports = {
    name: "upgrade-5.5.0",
    type: "cli-upgrade",
    version: "5.5.0",
    canUpgrade() {
        return true;
    },
    async upgrade(options, context) {
        const { info, success, error } = context;
        try {
            const start = new Date();
            const getDuration = () => {
                return (new Date() - start) / 1000;
            };

            info(`Applying ${info.hl("Webiny 5.5.0")} project changes...`);
            console.log();

            // 1. Move all .pulumi folders to project root
            console.log(info.hl("Step 1 of 6:"));
            await movePulumiFolders(context);
            console.log();

            // 2. Rename `webiny.root.js` to `webiny.project.js`.
            console.log(info.hl("Step 2 of 6:"));
            await renameWebinyRoot(context);
            console.log();

            // 3. Create `webiny.application.js` files
            console.log(info.hl("Step 3 of 6:"));
            await createWebinyApplication(context);
            console.log();

            // 4 . Add `watch` command to all packages within the API project application.
            console.log(info.hl("Step 4 of 6:"));
            await addWatchCommandToApi(context);
            console.log();

            // 5. Add the `watch` command to React apps in apps/admin and apps/website project applications.
            console.log(info.hl("Step 5 of 6:"));
            await addWatchCommandToReactApps(context);
            console.log();

            // 6. Custom packages.
            // - add `webiny.config.js` with `build` and `watch` scripts.
            // - add `@webiny/cli` and `@webiny/project-utils` to `package.json` files
            // - replace existing `build` and `watch` commands with new ones
            console.log(info.hl("Step 6 of 6:"));
            await updateCustomPackages(context);
            console.log();

            // -------------------------------- Finish --------------------------------

            const duration = getDuration();
            success(`Done! Update of project files finished in ${success.hl(duration + "s")}.`);
            console.log();

            // Enabling logs (optional)
            // Add WEBINY_LOGS_FORWARD_URL to `api` and `headless-cms` functions
            // add `@webiny/handler-logs` package in `api` packages
            info(
                `Optionally, you can also enable the new ${info.hl(
                    "logging"
                )} feature, that's part of the new ${info.hl("watch")} command.`
            );
            info(
                `To learn more, please visit https://www.webiny.com/docs/how-to-guides/upgrade-webiny/5.4.0-to-5.5.0`
            );
        } catch (e) {
            error(
                `An error occurred while executing the ${error.hl(
                    "Webiny 5.5.0"
                )} project upgrade script:`
            );
            console.log(e);
            console.log();
            info(
                `For more information on how to execute the upgrade steps manually, please visit https://www.webiny.com/docs/how-to-guides/upgrade-webiny/5.4.0-to-5.5.0`
            );
        }
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

const PROJECT_APPLICATIONS = ["api", "apps/admin", "apps/site", "apps/website"];

const movePulumiFolders = async context => {
    const { project, info, warning, success } = context;

    info(`Moving ${info.hl(".pulumi")} folders to project root...`);

    for (let i = 0; i < PROJECT_APPLICATIONS.length; i++) {
        const projectApplicationPath = PROJECT_APPLICATIONS[i];
        const pulumiFolderPath = join(projectApplicationPath, ".pulumi");
        const stateFolder = join(project.root, ".pulumi", projectApplicationPath, ".pulumi");
        if (fs.existsSync(pulumiFolderPath)) {
            info(
                `Moving ${info.hl(pulumiFolderPath)} folder to project root (${info.hl(
                    stateFolder
                )}).`
            );

            if (!fs.existsSync(stateFolder)) {
                fs.mkdirSync(stateFolder, { recursive: true });

                await ncp(pulumiFolderPath, stateFolder);

                rimraf.sync(join(pulumiFolderPath));

                success(`Moved ${info.hl(".pulumi")} folder to project root.`);
            } else {
                warning(`Skipping... folder ${warning.hl(stateFolder)} already exists.`);
            }
        } else {
            info(`Folder ${info.hl(pulumiFolderPath)} doesn't exist, continuing.`);
        }
    }
};

const renameWebinyRoot = context => {
    const { project, info, warning, success } = context;

    info(`Renaming ${info.hl("webiny.root.js")} to ${info.hl("webiny.project.js")}...`);

    const webinyRootPath = join(project.root, "webiny.root.js");
    const webinyProjectPath = join(project.root, "webiny.project.js");
    if (fs.existsSync(webinyProjectPath)) {
        warning(`Could not rename - ${warning.hl("webiny.project.js")} already exists.`);
    } else {
        fs.renameSync(webinyRootPath, webinyProjectPath);
        success(
            `Successfully renamed ${success.hl("webiny.root.js")} to ${success.hl(
                "webiny.project.js"
            )}.`
        );
    }
};

const createWebinyApplication = context => {
    const { info, warning, success } = context;

    info(`Creating ${info.hl("webiny.application.js")} files...`);

    for (let i = 0; i < PROJECT_APPLICATIONS.length; i++) {
        let projectApplication;
        try {
            projectApplication = getProjectApplication({ cwd: PROJECT_APPLICATIONS[i] });
        } catch {
            continue;
        }
        const applicationFilePath = join(projectApplication.root, "webiny.application.js");
        if (fs.existsSync(applicationFilePath)) {
            warning(
                `Skipping creation of ${warning.hl("webiny.application.js")} file in ${warning.hl(
                    projectApplication.name
                )} project application - already exists.`
            );
        } else {
            const from = join(
                __dirname,
                "templates",
                "webinyApplication",
                `${PROJECT_APPLICATIONS[i]}/webiny.application.js`
            );

            const to = join(projectApplication.root, "webiny.application.js");

            fs.copyFileSync(from, to);

            projectApplication = getProjectApplication({ cwd: PROJECT_APPLICATIONS[i] });
            success(
                `Successfully created ${success.hl("webiny.application.js")} in ${success.hl(
                    projectApplication.name
                )} project application.`
            );
        }
    }
};

const addWatchCommandToApi = async context => {
    const { info, warning, success } = context;

    info(
        `Adding ${info.hl("watch")} command to all ${info.hl("webiny.config.js")} and ${info.hl(
            "package.json"
        )} files located within the ${info.hl("API")} project application...`
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

    info(`Found ${info.hl(apiPackages.length)} packages.`);

    for (let i = 0; i < apiPackages.length; i++) {
        const packagePath = apiPackages[i];
        const packageJsonPath = join(packagePath, "package.json");
        const packageJson = loadJson.sync(packageJsonPath);
        info(info.hl(packagePath));
        if (packageJson.scripts.watch) {
            warning(
                `Skipped updating ${warning.hl("package.json")} - ${warning.hl(
                    "watch"
                )} script already exists.`
            );
        } else {
            packageJson.scripts.watch = "yarn webiny run watch";
            writeJson.sync(packageJsonPath, packageJson);
            success(`Updated ${warning.hl("package.json")} - ${warning.hl("watch")} script added.`);
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
                `Skipped updating ${warning.hl("webiny.config.js")} - ${warning.hl(
                    "watch"
                )} command already exists.`
            );
        } else {
            const from = join(__dirname, "templates", "api", map.file);
            const to = join(packagePath, "webiny.config.js");
            fs.copyFileSync(from, to);

            success(
                `Updated ${warning.hl("webiny.config.js")} - ${warning.hl("watch")} command added.`
            );
        }
    }
};

const addWatchCommandToReactApps = async context => {
    const { info, warning, success } = context;

    info(
        `Adding ${info.hl("watch")} command to all ${info.hl(
            "package.json"
        )} files located within the ${info.hl("Admin Area")} and ${info.hl(
            "Website"
        )} project application...`
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

    info(`Found ${info.hl(appsPackages.length)} packages.`);

    for (let i = 0; i < appsPackages.length; i++) {
        const packagePath = appsPackages[i];
        const packageJsonPath = join(packagePath, "package.json");
        const packageJson = loadJson.sync(packageJsonPath);
        if (!packageJson.scripts || !packageJson.scripts.start) {
            continue;
        }

        info(info.hl(packagePath));
        if (packageJson.scripts.watch) {
            warning(
                `Skipped updating ${warning.hl("package.json")} - ${warning.hl(
                    "watch"
                )} script already exists.`
            );
        } else {
            packageJson.scripts.watch = packageJson.scripts.start;
            writeJson.sync(packageJsonPath, packageJson);
            success(`Updated ${warning.hl("package.json")} - ${warning.hl("watch")} script added.`);
        }
    }
};

const updateCustomPackages = async context => {
    const { info, warning, success } = context;

    info(
        `Adding ${info.hl("watch")} command to all ${info.hl("webiny.config.js")} and ${info.hl(
            "package.json"
        )} files located within the ${info.hl("packages")} folder...`
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

    info(`Found ${info.hl(customPackages.length)} packages.`);

    for (let i = 0; i < customPackages.length; i++) {
        const packagePath = customPackages[i];
        const packageJsonPath = join(packagePath, "package.json");
        const packageJson = loadJson.sync(packageJsonPath);

        const tsConfigPath = join(packagePath, "tsconfig.json");
        if (!fs.existsSync(tsConfigPath)) {
            continue;
        }

        info(info.hl(packagePath));
        if (!packageJson.scripts.build || packageJson.scripts.build.includes("babel")) {
            packageJson.scripts.build = "yarn webiny run build";
            success(`Updated ${warning.hl("package.json")} - ${warning.hl("build")} script added.`);
        } else {
            warning(
                `Skipped updating ${warning.hl("package.json")} - ${warning.hl(
                    "build"
                )} script already exists.`
            );
        }

        if (!packageJson.scripts.watch || packageJson.scripts.watch.includes("babel")) {
            packageJson.scripts.watch = "yarn webiny run watch";
            success(`Updated ${warning.hl("package.json")} - ${warning.hl("watch")} script added.`);
        } else {
            warning(
                `Skipped updating ${warning.hl("package.json")} - ${warning.hl(
                    "watch"
                )} script already exists.`
            );
        }

        await prettier.resolveConfig(packageJsonPath).then(options => {
            const content = prettier.format(JSON.stringify(packageJson, null, 2), {
                ...options,
                parser: "json"
            });
            fs.writeFileSync(packageJsonPath, content);
        });

        if (packageJson.scripts.postbuild) {
            warning(
                `Detected ${warning.hl(
                    "postbuild"
                )} script. You might want to remove it since its no longer used by the new ${warning.hl(
                    "build"
                )} script`
            );
        }

        const webinyConfigJsPath = join(packagePath, "webiny.config.js");
        if (!fs.existsSync(webinyConfigJsPath)) {
            const from = join(__dirname, "templates", "customPackages", "webiny.config.js");
            const to = join(packagePath, "webiny.config.js");
            fs.copyFileSync(from, to);

            success(`Created ${warning.hl("webiny.config.js")}.`);
        } else {
            warning(`Skipping creation of ${warning.hl("webiny.config.js")} - already exists.`);
        }
    }
};
