import path from "path";
import fs from "fs";

import { defineAppHook } from "@webiny/pulumi-sdk";
import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";
import uploadFolderToS3 from "@webiny/cli-plugin-deploy-pulumi/utils/aws/uploadFolderToS3";

export const websiteUpload = defineAppHook(async (params, context) => {
    if (params.inputs.build === false) {
        context.info(`"--no-build" argument detected - skipping React application upload.`);
        return;
    }

    context.info("Uploading React application...");

    const appRoot = params.projectApplication.root;
    const buildFolderPath = path.join(appRoot, "code", "build");
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
        bucket: websiteOutput["appStorage"],
        acl: "public-read",
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

    context.success(`React application successfully uploaded in ${context.success.hl(duration)}s.`);
});
