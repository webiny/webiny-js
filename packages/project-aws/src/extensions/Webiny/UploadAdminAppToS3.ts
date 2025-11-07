import { createImplementation } from "@webiny/di";
import {
    AdminAfterDeploy,
    GetApp,
    GetAppStackOutput,
    UiService
} from "@webiny/project/abstractions/index.js";
import fs from "fs";
import { uploadFolderToS3 } from "~/pulumi/index.js";
import { type IDefaultStackOutput } from "~/pulumi/types.js";

class UploadAdminAppToS3 implements AdminAfterDeploy.Interface {
    constructor(
        private ui: UiService.Interface,
        private getApp: GetApp.Interface,
        private getAppStackOutput: GetAppStackOutput.Interface
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
        const appOutput = await this.getAppStackOutput.execute<IDefaultStackOutput>(params);
        if (!appOutput) {
            throw new Error("Missing app stack output.");
        }

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

export default createImplementation({
    abstraction: AdminAfterDeploy,
    implementation: UploadAdminAppToS3,
    dependencies: [UiService, GetApp, GetAppStackOutput]
});
