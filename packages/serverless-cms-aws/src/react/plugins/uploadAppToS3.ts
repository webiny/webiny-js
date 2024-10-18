import * as path from "path";
import * as fs from "fs";
import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";
import { uploadFolderToS3, UploadFolderToS3Params } from "@webiny/pulumi-aws";
import { CliContext } from "@webiny/cli/types";

export type UploadAppToS3Config = Partial<
    Pick<
        UploadFolderToS3Params,
        | "path"
        | "cacheControl"
        | "onFileUploadSuccess"
        | "onFileUploadSkip"
        | "onFileUploadError"
        | "acl"
    >
> & {
    folder: string;
};

/**
 * This plugin uploads the React application to the deployed Amazon S3 bucket.
 * The plugin is executed right after the React application has been successfully built
 * and relevant cloud infrastructure resources have been deployed (via `webiny deploy` command).
 * https://www.webiny.com/docs/how-to-guides/deployment/deploy-your-project/
 */
export const uploadAppToS3 = ({ folder, ...config }: UploadAppToS3Config) => ({
    type: "hook-after-deploy",
    name: "hook-after-deploy-upload-app-to-s3",
    async hook(params: Record<string, any>, context: CliContext) {
        // No need to upload the app if we're doing a preview.
        if (params.inputs.preview) {
            return;
        }

        const { projectApplication } = params;

        context.info("Uploading React application...");

        const buildFolderPath = path.join(projectApplication.paths.absolute, "build");
        if (!fs.existsSync(buildFolderPath)) {
            throw new Error("Cannot continue, build folder not found.");
        }

        const start = new Date().getTime();
        const appOutput = getStackOutput({
            folder,
            env: params.env
        });

        await uploadFolderToS3({
            path: buildFolderPath,
            bucket: appOutput.appStorage,
            acl: "private",
            cacheControl: [
                {
                    pattern: /index\.html/,
                    value: "no-cache, no-store, must-revalidate"
                },
                {
                    pattern: /robots\.txt/,
                    value: "no-cache, no-store, must-revalidate"
                },
                {
                    pattern: /.*/,
                    value: "max-age=31536000"
                }
            ],
            onFileUploadSuccess: ({ paths }) => {
                context.success(paths.relative);
            },
            onFileUploadError: ({ paths, error }) => {
                context.error("Failed to upload " + context.error.hl(paths.relative));
                console.log(error);
            },
            onFileUploadSkip: ({ paths }) => {
                context.info(`Skipping ${context.info.hl(paths.relative)}, already exists.`);
            },
            ...config
        });

        const duration = (new Date().getTime() - start) / 1000;

        context.success(
            `React application successfully uploaded in ${context.success.hl(duration)}s.`
        );
    }
});
