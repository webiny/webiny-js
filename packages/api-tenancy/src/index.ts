import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { TenancyContext, TenancyStorageOperationsFactory } from "./types";
import { createTenancy } from "./Tenancy";
import graphqlPlugins from "./graphql";

interface TenancyPluginsParams {
    storageOperationsFactory: TenancyStorageOperationsFactory;
}

export default ({ storageOperationsFactory }: TenancyPluginsParams) => [
    new ContextPlugin<TenancyContext>(async context => {
        const { headers = {} } = context.http.request;

        let tenantId = headers["X-Tenant"] || headers["x-tenant"];
        if (!tenantId) {
            tenantId = "root";
        }

        context.tenancy = await createTenancy({
            tenant: tenantId,
            storageOperations: storageOperationsFactory()
        });
    }),
    graphqlPlugins
];
