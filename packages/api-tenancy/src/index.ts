import Error from "@webiny/error";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { TenancyContext, TenancyStorageOperations } from "./types";
import { createTenancy } from "./createTenancy";
import graphql from "./graphql";

interface TenancyPluginsParams {
    multiTenancy?: boolean;
    storageOperations: TenancyStorageOperations;
}

export const createTenancyContext = ({ multiTenancy, storageOperations }: TenancyPluginsParams) => {
    return new ContextPlugin<TenancyContext>(async context => {
        let tenantId = "root";

        if (multiTenancy === true) {
            const { headers = {}, method } = context.http.request;

            tenantId = headers["x-tenant"];

            if (!tenantId && method === "POST") {
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
    });
};

export const createTenancyGraphQL = () => graphql;
