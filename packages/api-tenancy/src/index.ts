import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/api";
import { createWcpContext } from "@webiny/api-wcp";
import type { TenancyContext, TenancyStorageOperations } from "./types.js";
import { setupFeatures } from "./setupFeatures.js";
import { LegacyContext } from "./legacy/LegacyContext.js";
import { GetTenantByIdUseCase } from "~/features/GetTenantById/index.js";
import { TenantContext } from "~/features/TenantContext/index.js";
import { createTenantSchema } from "~/graphql/tenant.gql.js";

interface TenancyPluginsParams {
    storageOperations: TenancyStorageOperations;
}

async function applyBackwardsCompatibility(context: any) {
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

        setupFeatures(context.container, storageOperations);

        // Add WCP telemetry identifier
        // This tenancy package is used by GraphQL, Headless CMS, and PB import/export functions
        context.plugins.register({ type: "wcp-telemetry-tracker" });

        // We need to load tenant, and set the current tenant context.
        const getTenantById = context.container.resolve(GetTenantByIdUseCase);
        const tenantResult = await getTenantById.execute(tenantId);
        if (tenantResult.isOk()) {
            const tenantContext = context.container.resolve(TenantContext);
            tenantContext.setTenant(tenantResult.value);
        } else {
            // If there's no `root` tenant, it means system installation wasn't finished yet.
            // But all other tenants should throw an error.
            if (tenantId !== "root") {
                throw new Error("Unable to load tenant!");
            }
        }

        // TODO: Legacy!
        // Set up legacy context. We use this API in many places across our codebase, and this will provide
        // a working bridge until everything is migrated to use DI container.
        context.tenancy = new LegacyContext(context.container);
    });
};

export const createTenancyGraphQL = () => {
    return createTenantSchema();
};
