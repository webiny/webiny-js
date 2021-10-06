import Error from "@webiny/error";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { TenancyContext, TenancyStorageOperations } from "./types";
import { createTenancy } from "./createTenancy";
import graphqlPlugins from "./graphql";
import multiTenancyPlugins from "./multiTenancy";

interface TenancyPluginsParams {
    multiTenancy?: boolean;
    storageOperations: TenancyStorageOperations;
}

export default ({ multiTenancy, storageOperations }: TenancyPluginsParams) => {
    return [
        new ContextPlugin<TenancyContext>(async context => {
            let tenantId = "root";

            if (multiTenancy === true) {
                // In multi-tenant environments, `x-tenant` header is mandatory.
                const { headers = {} } = context.http.request;

                tenantId = headers["x-tenant"];

                if (!tenantId) {
                    throw new Error({
                        message: `"x-tenant" header is missing in the request!`,
                        code: "MISSING_TENANT_HEADER"
                    });
                }
            }

            context.tenancy = await createTenancy({
                tenant: tenantId,
                multiTenancy,
                storageOperations
            });
        }),
        multiTenancy ? multiTenancyPlugins() : null,
        graphqlPlugins
    ].filter(Boolean);
};
