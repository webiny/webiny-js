const getStackOutput = require("@webiny/cli-plugin-deploy-pulumi/utils/getStackOutput");
const uploadFolderToS3 = require("@webiny/cli-plugin-deploy-pulumi/utils/aws/uploadFolderToS3");
const path = require("path");
const fs = require("fs");

/**
 * This plugin uploads the Website React application to the deployed Amazon S3 bucket.
 * The plugin is executed right after the Website React application has been successfully built
 * and relevant cloud infrastructure resources have been deployed (via `webiny deploy` command).
 * https://www.webiny.com/docs/how-to-guides/deployment/deploy-your-project/
 */
export default {
    type: "hook-after-deploy",
    name: "hook-after-deploy-website",
    async hook(params, context) {
        // Only handle Website React application.
        if (params.projectApplication.id !== "website") {
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
        const websiteOutput = getStackOutput({
            folder: "apps/website",
            env: params.env
        });

        await uploadFolderToS3({
            path: buildFolderPath,
            bucket: websiteOutput.appStorage,
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
    }
};
