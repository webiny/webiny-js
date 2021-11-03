const getStackOutput = require("@webiny/cli-plugin-deploy-pulumi/utils/getStackOutput");
const uploadFolderToS3 = require("@webiny/cli-plugin-deploy-pulumi/utils/aws/uploadFolderToS3");
const path = require("path");
const fs = require("fs");

export default {
    type: "hook-after-deploy",
    name: "hook-after-deploy-admin-upload",
    async hook(params, context) {
        if (params.projectApplication.id !== "admin") {
            return;
        }

        if (params.inputs.build === false) {
            context.info(
                `"--no-build" argument detected - skipping React application upload and prerendering.`
            );
            return;
        }

        context.info("Uploading React application...");
        const adminOutput = getStackOutput({
            folder: "apps/admin",
            env: params.env
        });

        const buildFolderPath = path.join(__dirname, "..", "code", "build");
        if (!fs.existsSync(buildFolderPath)) {
            throw new Error("Cannot continue, build folder not found.");
        }

        const start = new Date();
        const getDuration = () => {
            return (new Date() - start) / 1000;
        };

        await uploadFolderToS3({
            path: buildFolderPath,
            bucket: adminOutput.appStorage,
            onFileUploadSuccess: ({ paths }) => {
                context.success(paths.relative);
            },
            onFileUploadError: ({ paths, error }) => {
                context.error("Failed to upload " + context.error.hl(paths.relative));
                console.log(error);
            }
        });

        context.success(
            `React application successfully uploaded in ${context.success.hl(getDuration())}s.`
        );
    }
};
