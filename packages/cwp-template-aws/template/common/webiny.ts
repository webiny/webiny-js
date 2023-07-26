import cliPulumiDeploy from "@webiny/cli-plugin-deploy-pulumi";
import cliAwsTemplate from "@webiny/cwp-template-aws/cli";

// Scaffolds.
import cliScaffold from "@webiny/cli-plugin-scaffold";
import cliScaffoldCiCd from "@webiny/cli-plugin-scaffold-ci";
import cliProjectDdb from "@webiny/project-ddb/cli";

export default {
    template: "[TEMPLATE_VERSION]",
    name: "[PROJECT_NAME]",
    cli: {
        plugins: [
            cliPulumiDeploy(),
            cliAwsTemplate(),
            cliProjectDdb(),

            // Scaffolds.
            cliScaffold(),
            cliScaffoldCiCd()
        ]
    }
};
