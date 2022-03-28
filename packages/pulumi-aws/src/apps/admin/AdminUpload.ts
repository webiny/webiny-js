import path from "path";
import fs from "fs";
import chalk from "chalk";

import uploadFolderToS3 from "@webiny/cli-plugin-deploy-pulumi/utils/aws/uploadFolderToS3";

interface AdminUploadParams {
    bucket: string;
    appDir: string;
}

export async function adminUpload(params: AdminUploadParams) {
    console.info("Uploading React application...");

    const buildFolderPath = path.join(params.appDir, "code", "build");
    if (!fs.existsSync(buildFolderPath)) {
        throw new Error("Cannot continue, build folder not found.");
    }

    const start = new Date().getTime();

    await uploadFolderToS3({
        path: buildFolderPath,
        bucket: params.bucket,
        acl: "public-read",
        onFileUploadSuccess(args: any) {
            // TODO console.success(args.paths.relative);
            console.log(`Uploaded ${chalk.green(args.paths.relative)}`);
        },
        onFileUploadError(args: any) {
            console.error("Failed to upload " + chalk.red(args.paths.relative));
            console.log(args.error);
        },
        onFileUploadSkip(args: any) {
            console.info(`Skipping ${chalk.blue(args.paths.relative)}, already exists.`);
        }
    });

    const duration = (new Date().getTime() - start) / 1000;

    console.log(`React application successfully uploaded in ${chalk.green(duration)}s.`);
}
