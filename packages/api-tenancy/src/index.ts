import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/handler";
import { TenancyContext, TenancyStorageOperations } from "./types";
import { createTenancy } from "./createTenancy";
import graphql from "./graphql/full.gql";
import baseGraphQLTypes from "./graphql/types.gql";
import { createWcpContext } from "@webiny/api-wcp";

interface TenancyPluginsParams {
    storageOperations: TenancyStorageOperations;
}

async function applyBackwardsCompatibility(context: TenancyContext) {
    if (!context.wcp) {
        // This can happen in projects created prior to 5.29.0 release.
        await createWcpContext().apply(context);
    }
}

export const createTenancyContext = ({ storageOperations }: TenancyPluginsParams) => {
    return new ContextPlugin<TenancyContext>(async context => {
        let tenantId = "root";

        await applyBackwardsCompatibility(context);

        const multiTenancy = context.wcp.canUseFeature("multiTenancy");

        if (multiTenancy) {
            const { headers = {}, method } = context.http.request;

            tenantId = headers["x-tenant"];

            if (!tenantId && method === "POST") {
                throw new WebinyError({
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

        // Even though we don't have a full GraphQL schema when using the `context` plugins,
        // we still need to register the base tenancy types, so other plugins can extend and use them
        // in other GraphQLSchema plugins.
        context.plugins.register(baseGraphQLTypes);

        // Add WCP telemetry identifier
        // This tenancy package is used by GraphQL, Headless CMS, and PB import/export functions
        context.plugins.register({ type: "wcp-telemetry-tracker" });
    });
};

export const createTenancyGraphQL = () => [graphql];
