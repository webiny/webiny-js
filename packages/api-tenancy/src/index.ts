import Error from "@webiny/error";
import { ContextPlugin } from "@webiny/handler";
import { TenancyContext, TenancyStorageOperations } from "./types";
import { createTenancy } from "./createTenancy";
import graphql from "./graphql";

interface TenancyPluginsParams {
    storageOperations: TenancyStorageOperations;
}

export const createTenancyContext = ({ storageOperations }: TenancyPluginsParams) => {
    return new ContextPlugin<TenancyContext>(async context => {
        let tenantId = "root";

        const multiTenancy = process.env.WEBINY_MULTI_TENANCY === "true";

        if (multiTenancy) {
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
