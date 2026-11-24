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
         * AWS hosting-type dependencies: the `webiny` CLI (AWS bin), Cognito (AWS-managed IdP), SMTP mail,
         * `@webiny/project-aws`, the optional peer of `webiny` behind `webiny/infra` and the AWS
         * implementations of the shared `webiny/extensions` namespaces, and `@webiny/db-dynamodb`,
         * the optional peer of `webiny` behind `webiny/api/db`.
         */
        addProjectDependencies(projectRootFolderPath, {
            "@webiny/cli-aws": "latest",
            "@webiny/cognito": "latest",
            "@webiny/db-dynamodb": "latest",
            "@webiny/mailer-smtp": "latest",
            "@webiny/project-aws": "latest"
        });

        /*
         * On Postgres, the API functions run the handlers of `@webiny/api-event-handler-aws-pg`,
         * which the project's api entry imports and which brings knex and pg, so only Postgres
         * projects install it. The CMS storage and the folder catalog come with
         * `<Infra.AuroraPostgres />`, from `webiny` itself: the api build imports them by path.
         */
        if (awsArgs.storageOps === "pg") {
            addProjectDependencies(projectRootFolderPath, {
                "@webiny/api-event-handler-aws-pg": "latest"
            });
        }

        // Write the chosen region into `webiny.config.tsx`.
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
