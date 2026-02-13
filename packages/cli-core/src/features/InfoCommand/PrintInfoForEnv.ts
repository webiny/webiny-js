import { GetProjectSdkService, UiService } from "~/abstractions/index.js";
import chalk from "chalk";

export interface IPrintInfoForEnvParams {
    env: string;
    variant?: string;
}

export interface IPrintInfoForEnvDi {
    getProjectSdkService: GetProjectSdkService.Interface;
    uiService: UiService.Interface;
}

export class PrintInfoForEnv {
    constructor(private di: IPrintInfoForEnvDi) {}

    async execute(params: IPrintInfoForEnvParams) {
        if (typeof params !== "object" || !params.env) {
            throw new Error("Please provide an object with `env` and `variant` properties.");
        }

        const { getProjectSdkService, uiService } = this.di;

        const projectSdk = await getProjectSdkService.execute();
        const ui = uiService;

        const { env, variant } = params;

        const projectId = await projectSdk.getProjectId();
        const resourcePrefix = await projectSdk.getPulumiResourceNamePrefix();

        const api = await projectSdk.getAppStackOutput("api");

        const admin = await projectSdk.getAppStackOutput("admin");

        const outputs = [api, admin];

        const stacksDeployedCount = outputs.filter(Boolean).length;

        if (stacksDeployedCount === 0) {
            const variantMessage = variant ? ` and variant ${variant}` : "";
            ui.info(
                [
                    `It seems none of the stacks were deployed, so no info could be provided.`,
                    `Please check if the provided environment %s is correct.`
                ].join(" "),
                `${env}${variantMessage}`
            );
            return;
        }

        const output = [];

        // Project info.
        output.push(
            `‣ Project ID: ${projectId ? chalk.blue(projectId) : "-"}`,
            `‣ Resource prefix: ${chalk.blue(resourcePrefix)}`
        );

        // API.
        if (api) {
            output.push(
                `‣ Environment name: ${chalk.blue(env)}`,
                `‣ Environment variant name: ${variant ? chalk.blue(variant) : "-"}`,
                `‣ AWS region: ${api?.region}`,
                `‣ Main GraphQL API: ${api.apiUrl + "/graphql"}`,
                `‣ Headless CMS GraphQL API:`,
                `   · Manage API: ${api.apiUrl + "/cms/manage"}`,
                `   · Read API: ${api.apiUrl + "/cms/read"}`,
                `   · Preview API: ${api.apiUrl + "/cms/preview"}`
            );
        } else {
            output.push(
                `‣ Environment name: -`,
                `‣ Environment variant name: -`,
                `‣ AWS region: -`,
                `‣ Main GraphQL API: -`,
                `‣ Headless CMS GraphQL API:`,
                `   · Manage API: -`,
                `   · Read API: -`,
                `   · Preview API: -`
            );
        }

        // Admin.
        if (admin) {
            output.push(`‣ Admin app: ${admin.appUrl}`);
        } else {
            output.push(`‣ Admin app: -`);
        }

        ui.text(output.join("\n"));
    }
}
