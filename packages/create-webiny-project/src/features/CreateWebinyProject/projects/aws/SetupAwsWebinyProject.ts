import fs from "fs-extra";
import path from "path";
import { runInteractivePrompt } from "./runInteractivePrompt.js";
import { CliParams } from "../../../../types.js";
import { GetProjectRootPath } from "../../../../services/index.js";
import { AwsProjectParams } from "./types.js";
import { GetTemplatesFolderPath } from "../../../../services/GetTemplatesFolderPath.js";

export class SetupAwsWebinyProject {
    async execute(cliArgs: CliParams) {
        const awsArgs = await this.getAwsArgs(cliArgs);

        const getTemplatesFolderPath = new GetTemplatesFolderPath();
        const templatesFolderPath = getTemplatesFolderPath.execute();

        const storageTemplatePath = path.join(templatesFolderPath, "aws", awsArgs.storageOps);

        const getProjectRoot = new GetProjectRootPath();
        const projectRootFolderPath = getProjectRoot.execute(cliArgs);

        fs.copySync(storageTemplatePath, projectRootFolderPath);

        // Update .env file.
        const webinyConfigTsxEnvFilePath = path.join(projectRootFolderPath, "webiny.config.tsx");
        let content = fs.readFileSync(webinyConfigTsxEnvFilePath).toString();
        content = content.replace("{REGION}", awsArgs.region);
        fs.writeFileSync(webinyConfigTsxEnvFilePath, content);
    }

    private async getAwsArgs(cliArgs: CliParams) {
        const awsArgs: AwsProjectParams = { region: "us-east-1", storageOps: "ddb" };

        const { templateOptions: templateOptionsString } = cliArgs;
        if (templateOptionsString) {
            try {
                Object.assign(JSON.parse(templateOptionsString));
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
