import { createEmployeePlugins } from "./employees";
import { createInstallTenantPlugins } from "./installTenant";
import { createGraphQLSchemaPlugin } from "./content";
import { ContextPlugin } from "@webiny/api";
import { Context } from "./types";

export const createDemoPlugins = () => {
    return [
        new ContextPlugin<Context>(context => {
            context.requestedTenant = context.tenancy.getCurrentTenant();
        }),
        createInstallTenantPlugins(),
        createEmployeePlugins({
            region: String(process.env.AWS_REGION),
            userPoolId: String(process.env.WEBSITE_COGNITO_USER_POOL_ID)
        }),
        createGraphQLSchemaPlugin()
    ];
};
