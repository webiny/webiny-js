import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import {TenancyContext, TenancyStorageOperations} from "./types";
import { createTenancy } from "./createTenancy";
import graphqlPlugins from "./graphql";

interface TenancyPluginsParams {
    storageOperations: TenancyStorageOperations;
}

export default ({ storageOperations }: TenancyPluginsParams) => [
    new ContextPlugin<TenancyContext>(async context => {
        const { headers = {} } = context.http.request;

        let tenantId = headers["x-tenant"];
        if (!tenantId) {
            tenantId = "root";
        }

        context.tenancy = await createTenancy({
            tenant: tenantId,
            storageOperations
        });
    }),
    graphqlPlugins
];
