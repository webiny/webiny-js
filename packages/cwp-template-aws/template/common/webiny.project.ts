import cliWorkspaces from "@webiny/cli-plugin-workspaces";
import cliPulumiDeploy from "@webiny/cli-plugin-deploy-pulumi";
import cliAwsTemplate from "@webiny/cwp-template-aws/cli";

// Scaffolds.
import cliScaffold from "@webiny/cli-plugin-scaffold";
import cliScaffoldExtendGraphQlApi from "@webiny/cli-plugin-scaffold-graphql-service";
import cliScaffoldAdminModule from "@webiny/cli-plugin-scaffold-admin-app-module";
import cliScaffoldReactComponent from "@webiny/cli-plugin-scaffold-react-component";
import cliScaffoldCiCd from "@webiny/cli-plugin-scaffold-ci";

// Admin Area and Website CLI plugins.
import adminPlugins from "./apps/admin/cli";
import websitePlugins from "./apps/website/cli";

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
            cliScaffoldReactComponent(),
            cliScaffoldCiCd(),

            // Admin Area and Website CLI plugins.
            adminPlugins,
            websitePlugins
        ]
    }
};
