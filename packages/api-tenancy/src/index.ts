import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/api";
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
        if (!context.request) {
            throw new Error("MISSING CONTEXT REQUEST");
        }

        if (multiTenancy) {
            const { headers = {}, method, params, query } = context.request;

            tenantId = headers["x-tenant"] as string;

            if (!tenantId) {
                throw new WebinyError({
                    message: `"x-tenant" header is missing in the request!`,
                    code: "MISSING_TENANT_HEADER",
                    data: {
                        method,
                        params,
                        query
                    }
                });
            }
        }

        context.tenancy = await createTenancy({
            tenant: tenantId,
            multiTenancy,
            storageOperations,
            incrementWcpTenants: async () => {
                if (!context.wcp) {
                    return;
                }

                await context.wcp.incrementTenants();
            },
            decrementWcpTenants: async () => {
                if (!context.wcp) {
                    return;
                }

                await context.wcp.decrementTenants();
            }
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
