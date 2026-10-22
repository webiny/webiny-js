import { AdminAfterDeploy, GetApp, UiService } from "@webiny/project/abstractions/index.js";
import fs from "fs";
import { type IDefaultStackOutput } from "~/pulumi/types.js";
import { AdminStackOutputService } from "~/abstractions/index.js";

class UploadAdminAppToS3Impl implements AdminAfterDeploy.Interface {
    constructor(
        private ui: UiService.Interface,
        private getApp: GetApp.Interface,
        private adminStackOutputService: AdminStackOutputService.Interface
    ) {}

    async execute(params: AdminAfterDeploy.Params) {
        // No need to upload the app if we're doing a preview.
        if (params.preview) {
            return;
        }

        const ui = this.ui;
        ui.info("Uploading React application...");

        const app = this.getApp.execute(params.app);

        const buildFolderPath = app.paths.workspaceFolder.join("build").toString();
        if (!fs.existsSync(buildFolderPath)) {
            throw new Error("Cannot continue, build folder not found.");
        }

        const start = new Date().getTime();
        const appOutput = await this.adminStackOutputService.execute<IDefaultStackOutput>();
        if (!appOutput) {
            throw new Error("Missing app stack output.");
        }

        // Imported here rather than at the top of the file. Every CLI command imports this hook when
        // the project SDK registers its extensions, even `webiny --help`, and a top-level import used
        // to come through the `~/pulumi` barrel, which loads all of Pulumi and the AWS SDK: about
        // 2,700 modules. The upload is the only thing that needs it, so the upload pays for it.
        const { uploadFolderToS3 } = await import("~/pulumi/utils/uploadFolderToS3.js");

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
                ui.success(paths.relative);
            },
            onFileUploadError: ({ paths, error }) => {
                ui.error("Failed to upload %s", paths.relative);
                ui.text(error.message);
            },
            onFileUploadSkip: ({ paths }) => {
                ui.info(`Skipping %s, already exists.`, paths.relative);
            }
        });

        const duration = (new Date().getTime() - start) / 1000;

        ui.success(`React application successfully uploaded in %ss.`, duration);
    }
}

export const UploadAdminAppToS3 = AdminAfterDeploy.createImplementation({
    implementation: UploadAdminAppToS3Impl,
    dependencies: [UiService, GetApp, AdminStackOutputService]
});
