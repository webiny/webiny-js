import fs from "fs-extra";
import path from "path";
import { runInteractivePrompt } from "./runInteractivePrompt.js";
import { CliParams } from "../../../../types.js";
import { GetProjectRootPath } from "../../../../services/index.js";
import { AwsProjectParams } from "./types.js";
import { GetTemplatesFolderPath } from "../../../../services/GetTemplatesFolderPath.js";
import { addProjectDependencies } from "../addProjectDependencies.js";

export class SetupAwsWebinyProject {
    async execute(cliArgs: CliParams): Promise<AwsProjectParams> {
        const awsArgs = await this.getAwsArgs(cliArgs);

        const getTemplatesFolderPath = new GetTemplatesFolderPath();
        const templatesFolderPath = getTemplatesFolderPath.execute();

        const storageTemplatePath = path.join(templatesFolderPath, "aws", awsArgs.storageOps);

        const getProjectRoot = new GetProjectRootPath();
        const projectRootFolderPath = getProjectRoot.execute(cliArgs);

        fs.copySync(storageTemplatePath, projectRootFolderPath);

        /*
         * AWS hosting-type dependencies: the `webiny` CLI (AWS bin), Cognito (AWS-managed IdP), and
         * `@webiny/project-aws`, the optional peer of `webiny` behind `webiny/infra` and the AWS
         * implementations of the shared `webiny/extensions` namespaces.
         */
        addProjectDependencies(projectRootFolderPath, {
            "@webiny/cli-aws": "latest",
            "@webiny/cognito": "latest",
            "@webiny/project-aws": "latest"
        });

        // Update .env file.
        const webinyConfigTsxEnvFilePath = path.join(projectRootFolderPath, "webiny.config.tsx");
        let content = fs.readFileSync(webinyConfigTsxEnvFilePath).toString();
        content = content.replace("{REGION}", awsArgs.region);
        fs.writeFileSync(webinyConfigTsxEnvFilePath, content);

        return awsArgs;
    }

    private async getAwsArgs(cliArgs: CliParams) {
        const awsArgs: AwsProjectParams = {
            region: "us-east-1",
            storageOps: "ddb",
            aiAgent: "other"
        };

        const { templateOptions: templateOptionsString } = cliArgs;
        if (templateOptionsString) {
            try {
                Object.assign(awsArgs, JSON.parse(templateOptionsString));
            } catch {
                // Do nothing.
            }
        }

        if (cliArgs.interactive !== false) {
            Object.assign(awsArgs, await runInteractivePrompt());
        }

        return awsArgs;
    }
}
