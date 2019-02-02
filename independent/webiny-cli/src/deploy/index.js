const { homedir } = require("os");
const path = require("path");
const { blue } = require("chalk");
const fs = require("fs-extra");
const inquirer = require("inquirer");
const WebinyCloudSDK = require("webiny-cloud-sdk");
const archiver = require("archiver");
const createLogger = require("../logger");
const { spawnCommand } = require("../utils");

const home = homedir();
const webinyConfigPath = path.join(home, ".webiny", "config");
const projectConfigPath = path.join(process.cwd(), ".webiny");
const ui = new inquirer.ui.BottomBar();

export default class Deploy {
    siteId = null;
    accessToken = null;
    sdk = null;
    logger = createLogger();

    validateCiRequirements() {
        const { WEBINY_ACCESS_TOKEN, WEBINY_SITE_ID } = process.env;
        if (!WEBINY_ACCESS_TOKEN) {
            this.logger.error("WEBINY_ACCESS_TOKEN is not set!");
            process.exit(1);
        }
        if (!WEBINY_SITE_ID) {
            this.logger.error("WEBINY_SITE_ID is not set!");
            process.exit(1);
        }
    }

    async deploy({ folder, ...opts }) {
        if (opts.ci) {
            this.validateCiRequirements();
        }

        await this.setupSDK();

        // check if this project has been deployed previously
        // if not - show list of available sites
        // when selected - store site id into the `{projectRoot}/.webiny` file
        this.siteId = this.getSiteId();
        if (!this.siteId) {
            const { siteId } = await this.askForSite();
            this.siteId = siteId;
            this.storeSiteId(siteId);
        }

        if (folder) {
            const deploy = await this.deployFolder(folder, opts);
            if (!deploy) {
                return;
            }

            this.logger.log("Activating new deploy...\n");
            await this.sdk.activateDeploy(deploy.id);
            const url = await this.waitTillActive(deploy);
            if (!url) {
                this.logger.error(
                    `Deploy activation failed. Please retry your deploy one more time, then contact Webiny support.`
                );
                process.exit(1);
            }
            this.logger.success("Deploy completed!\n");
            this.logger.info(`Open ${blue(url)} to see your newly deployed app!`);
        } else {
            // TODO: add multi-deploy
            // Find all Webiny apps in the project
            // Create deploys for each app
            // Activate all apps
        }
    }

    async waitTillActive(deploy) {
        for (let i = 0; i < 10; i++) {
            await this.sleep(5000);
            const { active, url } = await this.sdk.isDeployActive(deploy.id);
            if (active) {
                return url;
            }
        }
        return null;
    }

    sleep(millis) {
        return new Promise(resolve => setTimeout(resolve, millis));
    }

    async deployFolder(folder, { build = true } = {}) {
        const appPath = path.join(process.cwd(), folder);

        const adminConfigPath = path.join(appPath, ".webiny");
        try {
            const config = await fs.readJsonSync(adminConfigPath, { throws: true });
            // Ensure `build` folder exists
            await this.ensureBuild(folder, build);

            if (config.type === "app") {
                return await this.deployApp(appPath, config);
            }

            return await this.deployFunction(appPath, config);
        } catch (err) {
            console.log(err);
            this.logger.error(`Config file ".webiny" is missing: "${adminConfigPath}"!`);
            process.exit(1);
        }
    }

    async deployApp(appPath, config) {
        const buildPath = path.join(appPath, "build");
        // create checksums for all files in the `build` folder
        this.logger.log(`Preparing deploy files...`);
        const files = await this.sdk.getFilesDigest(buildPath);

        // call API to create a new deploy record
        this.logger.log(`Creating a new deploy...`);
        try {
            const deploy = await this.sdk.createDeploy(
                this.siteId,
                config.type,
                config.path,
                files,
                { prerender: config.prerender }
            );

            this.logger.log("Uploading files (only new and modified files will be uploaded)...");
            await this.uploadFiles(deploy, files);

            return deploy;
        } catch (err) {
            this.checkNetworkError(err);
            this.logger.info(err.message);
            if (err.code !== "NO_CHANGES_DETECTED") {
                process.exit(1);
            }

            return null;
        }
    }

    async deployFunction(appPath, config) {
        const buildPath = path.join(appPath, "build");
        // create checksums for all files in the `build` folder
        this.logger.log(`Preparing deploy files...`);

        // create a file to stream archive data to.
        const zipFile = path.join(buildPath, "function.zip");
        await this.createZip(path.join(buildPath, "service"), zipFile);

        // call API to create a new deploy record
        this.logger.log(`Creating a new deploy...`);
        try {
            const zipHash = await this.sdk.getFileHash(zipFile);
            const files = [
                { key: "function.zip", hash: zipHash, abs: zipFile, type: "application/zip" }
            ];

            const deploy = await this.sdk.createDeploy(
                this.siteId,
                config.type,
                config.path,
                files
            );

            this.logger.log("Uploading function...");
            await this.uploadFiles(deploy, files);

            return deploy;
        } catch (err) {
            this.checkNetworkError(err);
            this.logger.info(err.message);
            if (err.code !== "NO_CHANGES_DETECTED") {
                process.exit(1);
            }

            return null;
        }
    }

    async uploadFiles(deploy, files: Array<Object>) {
        try {
            const presignedFiles = await this.sdk.presignFiles(
                this.siteId,
                deploy.id,
                deploy.files.filter(f => f.required).map(f => ({ key: f.key, type: f.type }))
            );

            const filesToUpload = await Promise.all(
                presignedFiles.map(async file => {
                    const abs = files.find(f => f.key === file.key).abs;
                    file.content = await fs.readFile(abs);
                    return file;
                })
            );

            await Promise.all(
                filesToUpload.map(async file => {
                    await this.sdk.uploadPresignedFile(file.presigned, file.content);
                    this.logger.success(file.key);
                })
            );
        } catch (err) {
            this.checkNetworkError(err);
            throw err;
        }
    }

    async createZip(folderToZip, outputPath) {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(outputPath);
            const archive = archiver("zip", { zlib: { level: 9 } });

            output.on("close", () => {
                this.logger.success("Function archive created!");
                resolve();
            });

            archive.on("warning", err => {
                if (err.code === "ENOENT") {
                    this.logger.info(err.message);
                } else {
                    this.logger.error(err.message);
                    reject(err);
                }
            });

            archive.on("error", err => {
                this.logger.error(err.message);
                reject(err);
            });

            archive.on("progress", data => {
                this.logger.log(
                    `Processing files ${data.entries.processed}/${data.entries.total}...`
                );
            });

            // pipe archive data to the file
            archive.pipe(output);
            archive.directory(folderToZip, false);
            archive.finalize();
        });
    }

    async ensureBuild(folder, autoBuild) {
        const appPath = path.join(process.cwd(), folder);
        const buildPath = path.join(appPath, "build");

        if (autoBuild) {
            this.logger.info("Running build...");
            this.logger.log(
                `To disable auto-build, run the deploy command with a ${blue(
                    "--no-build"
                )} parameter.`
            );
            await this.runBuild(appPath);
        } else {
            const buildExists = fs.pathExistsSync(buildPath);
            if (!buildExists) {
                this.logger.error(`${blue("build")} folder was not found in ${blue(folder)}!`);
                process.exit(1);
            }
        }
    }

    async setupSDK() {
        try {
            // check access token (env or home folder)
            let accessToken = this.getAccessToken();
            // if no token - ask for login
            if (!accessToken) {
                this.logger.log(`You are not logged in! Please enter your Personal Access Token.`);
                this.howToCreateAToken();
                await this.ensureToken();
            } else {
                this.instantiateSDK(accessToken);
                if (!(await this.sdk.whoami())) {
                    this.logger.error("The existing token is invalid!");
                    this.howToCreateAToken();
                    await this.ensureToken();
                }
            }
        } catch (err) {
            this.checkNetworkError(err);
        }
    }

    async runBuild(appFolder: string) {
        await spawnCommand("yarn", ["build"], { cwd: path.resolve(appFolder) });
    }

    getAccessToken() {
        if (process.env.WEBINY_ACCESS_TOKEN) {
            return process.env.WEBINY_ACCESS_TOKEN;
        }

        if (!fs.pathExistsSync(webinyConfigPath)) {
            return null;
        }

        const config = fs.readJsonSync(webinyConfigPath, { throws: false });
        if (!config) {
            return null;
        }

        return config.accessToken;
    }

    getSiteId() {
        if (process.env.WEBINY_SITE_ID) {
            return process.env.WEBINY_SITE_ID;
        }

        if (!fs.pathExistsSync(projectConfigPath)) {
            return null;
        }

        const config = fs.readJsonSync(projectConfigPath, { throws: false });
        if (!config) {
            return null;
        }

        return config.siteId;
    }

    storeAccessToken(accessToken) {
        fs.ensureFileSync(webinyConfigPath);

        let config = fs.readJsonSync(webinyConfigPath, { throws: false });
        if (!config) {
            config = {};
        }
        config.accessToken = accessToken;

        fs.writeJsonSync(webinyConfigPath, config);
    }

    storeSiteId(siteId) {
        fs.ensureFileSync(projectConfigPath);

        let config = fs.readJsonSync(projectConfigPath, { throws: false });
        if (!config) {
            config = {};
        }
        config.siteId = siteId;

        fs.writeJsonSync(projectConfigPath, config);
    }

    instantiateSDK(accessToken) {
        this.sdk = new WebinyCloudSDK({ token: accessToken });
    }

    askForToken() {
        return inquirer.prompt([
            {
                type: "input",
                name: "accessToken",
                message: `Personal Access Token:`,
                validate: async accessToken => {
                    this.instantiateSDK(accessToken);
                    ui.updateBottomBar("Verifying token...");
                    const user = await this.sdk.whoami();

                    if (!user) {
                        return "The provided token is invalid!";
                    }
                    return true;
                }
            }
        ]);
    }

    askForSite() {
        return inquirer.prompt([
            {
                type: "list",
                name: "siteId",
                message: "Which site are you deploying?",
                choices: async () => {
                    const sites = await this.sdk.sites();
                    return sites.map(site => ({
                        name: `${site.name} (${site.customHostname || site.freeHostname})`,
                        value: site.id
                    }));
                }
            }
        ]);
    }

    async ensureToken() {
        const { accessToken } = await this.askForToken();
        this.storeAccessToken(accessToken);
    }

    howToCreateAToken() {
        this.logger.info(
            `To create a token, log into your Webiny account and create a token in the account settings.`
        );
    }

    checkNetworkError(err) {
        if (err.code === "ECONNREFUSED") {
            this.logger.error(err.message);
            process.exit(1);
        }
    }
}
