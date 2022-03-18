import path from "path";
import fs from "fs";

import { defineAppHook } from "@webiny/pulumi-sdk";
import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";
import uploadFolderToS3 from "@webiny/cli-plugin-deploy-pulumi/utils/aws/uploadFolderToS3";

export const adminUpload = defineAppHook(async (params, context) => {
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
    const adminOutput = getStackOutput({
        folder: "apps/admin",
        env: params.env
    });

    await uploadFolderToS3({
        path: buildFolderPath,
        bucket: adminOutput["appStorage"],
        acl: "public-read",
        onFileUploadSuccess(args: any) {
            context.success(args.paths.relative);
        },
        onFileUploadError(args: any) {
            context.error("Failed to upload " + context.error.hl(args.paths.relative));
            console.log(args.error);
        },
        onFileUploadSkip(args: any) {
            context.info(`Skipping ${context.info.hl(args.paths.relative)}, already exists.`);
        }
    });

    const duration = (new Date().getTime() - start) / 1000;

    context.success(`React application successfully uploaded in ${context.success.hl(duration)}s.`);
});
