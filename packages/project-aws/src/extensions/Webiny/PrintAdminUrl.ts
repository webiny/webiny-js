import { createImplementation } from "@webiny/di-container";
import {
    AdminAfterDeploy,
    GetAppStackOutput,
    UiService
} from "@webiny/project/abstractions/index.js";
import { type IDefaultStackOutput } from "~/pulumi/types.js";
import chalk from "chalk";

interface IAdminStackOutput extends IDefaultStackOutput {
    appUrl?: string;
}

class PrintAdminUrl implements AdminAfterDeploy.Interface {
    constructor(
        private ui: UiService.Interface,
        private getAppStackOutput: GetAppStackOutput.Interface
    ) {}

    async execute(params: AdminAfterDeploy.Params) {
        // No need to print URL if we're doing a preview.
        if (params.preview) {
            return;
        }

        const appOutput = await this.getAppStackOutput.execute<IAdminStackOutput>(params);
        if (!appOutput) {
            this.ui.info("Admin app stack output not found.");
            return;
        }

        const { green, blue } = chalk;

        // Construct the Admin URL from stack output
        // Use appUrl if available (includes custom domain support), otherwise construct from appDomain
        const adminUrl = appOutput.appUrl || (appOutput.appDomain ? `https://${appOutput.appDomain}` : null);

        if (!adminUrl) {
            this.ui.info("Admin URL not available in stack output.");
            return;
        }

        const output = [
            "",
            green("Admin Application Deployed"),
            `‣ Environment: ${blue(params.env)}`,
            `‣ Admin URL: ${blue(adminUrl)}`,
            ""
        ];

        console.log(output.join("\n"));
    }
}

export default createImplementation({
    abstraction: AdminAfterDeploy,
    implementation: PrintAdminUrl,
    dependencies: [UiService, GetAppStackOutput]
});
