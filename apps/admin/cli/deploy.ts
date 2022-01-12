const getStackOutput = require("@webiny/cli-plugin-deploy-pulumi/utils/getStackOutput");
const uploadFolderToS3 = require("@webiny/cli-plugin-deploy-pulumi/utils/aws/uploadFolderToS3");
const { getProject } = require("@webiny/cli/utils");
const path = require("path");
const fs = require("fs");
const url = require("url");

type GatewayConfig = Record<
    string,
    {
        domain: string;
        weight: number;
    }
>;

/**
 * This plugin uploads the Admin Area React application to the deployed Amazon S3 bucket.
 * The plugin is executed right after the Admin Area React application has been successfully built
 * and relevant cloud infrastructure resources have been deployed (via `webiny deploy` command).
 * https://www.webiny.com/docs/how-to-guides/deployment/deploy-your-project/
 */
export default {
    type: "hook-after-deploy",
    name: "hook-after-deploy-admin",
    async hook(params, context) {
        // Only handle Admin Area React application.
        if (params.projectApplication.id !== "admin") {
            return;
        }

        if (params.inputs.build === false) {
            context.info(`"--no-build" argument detected - skipping React application upload.`);
            return;
        }

        context.info("Uploading React application...");

        const buildFolderPath = path.join(__dirname, "..", "code", "build");
        if (!fs.existsSync(buildFolderPath)) {
            throw new Error("Cannot continue, build folder not found.");
        }

        const start = new Date().getTime();
        const adminOutput = getStackOutput({
            folder: "apps/admin",
            env: params.env
        });

        await uploadFolderToS3({
            path: buildFolderPath,
            bucket: adminOutput.appStorage,
            onFileUploadSuccess: ({ paths }) => {
                context.success(paths.relative);
            },
            onFileUploadError: ({ paths, error }) => {
                context.error("Failed to upload " + context.error.hl(paths.relative));
                console.log(error);
            },
            onFileUploadSkip: ({ paths }) => {
                context.info(`Skipping ${context.info.hl(paths.relative)}, already exists.`);
            }
        });

        const duration = (new Date().getTime() - start) / 1000;

        context.success(
            `React application successfully uploaded in ${context.success.hl(duration)}s.`
        );

        const gatewayConfigPath = getGatewayConfigFilePath("apps/admin-gateway", params.env);
        if (!gatewayConfigPath) {
            return;
        }

        const gatewayConfig = readGatewayConfigFile(gatewayConfigPath);

        const appUrl = url.parse(adminOutput.appUrl, true);
        const appDomain = appUrl.host;

        if (gatewayConfig[params.env]) {
            // update existing config
            gatewayConfig[params.env].domain = appDomain;
        } else {
            gatewayConfig[params.env] = {
                domain: appDomain,
                // every newly deployed stage has 0 percents of traffic
                weight: 0
            };
        }

        writeGatewayConfigFile(gatewayConfigPath, gatewayConfig);
    }
};

function getGatewayConfigFilePath(app: string, env: string) {
    const envBase = getBaseEnv(env);
    if (!envBase) {
        return null;
    }

    const project = getProject();
    const gatewayPath = path.join(project.root, app);

    return path.join(gatewayPath, `config.${envBase}.json`);
}

// TODO move to one of oure packages (used in API pulumi code also)
function getBaseEnv(env: string) {
    // matches strings like prod.v3
    const envRegex = /^(.*?)(\.(.+))$/i;
    const envMatch = envRegex.exec(env);
    if (!envMatch) {
        return null;
    }

    return envMatch[1];
}

function readGatewayConfigFile(filePath: string): GatewayConfig {
    if (!fs.existsSync(filePath)) {
        return {};
    }

    const configJson = fs.readFileSync(filePath, { encoding: "utf-8" });

    return JSON.parse(configJson) || {};
}

function writeGatewayConfigFile(filePath: string, config: GatewayConfig) {
    const configJson = JSON.stringify(config, null, 4);
    fs.writeFileSync(filePath, configJson, { encoding: "utf-8" });
}
