import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";
import { uploadFolderToS3 } from "@webiny/pulumi-aws";
import * as path from "path";
import * as fs from "fs";
import { CliContext } from "@webiny/cli/types";

/**
 * This plugin uploads the Admin Area React application to the deployed Amazon S3 bucket.
 * The plugin is executed right after the Admin Area React application has been successfully built
 * and relevant cloud infrastructure resources have been deployed (via `webiny deploy` command).
 * https://www.webiny.com/docs/how-to-guides/deployment/deploy-your-project/
 */
export const deployAdminPlugin = {
    type: "hook-after-deploy",
    name: "hook-after-deploy-admin",
    async hook(params: Record<string, any>, context: CliContext) {
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
    }
};
