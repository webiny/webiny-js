import cliWorkspaces from "@webiny/cli-plugin-workspaces";
import cliPulumiDeploy from "@webiny/cli-plugin-deploy-pulumi";
import cliAwsTemplate from "@webiny/cwp-template-aws/cli";

// Scaffolds.
import cliScaffold from "@webiny/cli-plugin-scaffold";
import cliScaffoldExtendGraphQlApi from "@webiny/cli-plugin-scaffold-graphql-service";
import cliScaffoldAdminModule from "@webiny/cli-plugin-scaffold-admin-app-module";
import cliScaffoldExtensions from "@webiny/cli-plugin-scaffold-extensions";
import cliScaffoldCiCd from "@webiny/cli-plugin-scaffold-ci";

export default {
    template: "[TEMPLATE_VERSION]",
    name: "[PROJECT_NAME]",
    cli: {
        plugins: [
            cliWorkspaces(),
            cliPulumiDeploy(),
            cliAwsTemplate(),

            // Scaffolds.
            cliScaffold(),
            cliScaffoldExtendGraphQlApi(),
            cliScaffoldAdminModule(),
            cliScaffoldExtensions(),
            cliScaffoldCiCd()
        ]
    },
    appAliases: {
        core: "apps/core",
        api: "apps/api",
        admin: "apps/admin",
        website: "apps/website"
    }
};
