import { ContextPlugin } from "@webiny/api";
import { Request } from "@webiny/handler";
import type { ApiCoreContext } from "~/types/core.js";
import { GetTenantByIdUseCase } from "~/features/tenancy/GetTenantById/index.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { LegacyContext } from "~/legacy/tenancy/LegacyContext.js";
import { RootTenantValue } from "~/domain/tenancy/RootTenantValue.js";

export const createTenancyContext = () => {
    return new ContextPlugin<ApiCoreContext>(async context => {
        let tenantId = "root";

        const request = context.container.resolve(Request);

        const multiTenancy = context.wcp.canUseFeature("multiTenancy");
        if (!request) {
            throw new Error("MISSING CONTEXT REQUEST");
        }

        if (multiTenancy) {
            const { headers = {} } = request;

            tenantId = (headers["x-tenant"] as string) ?? "root";
        }

        // Add WCP telemetry identifier
        // This tenancy package is used by GraphQL, Headless CMS, and PB import/export functions
        context.plugins.register({ type: "wcp-telemetry-tracker" });

        // We need to load tenant, and set the current tenant context.
        const getTenantById = context.container.resolve(GetTenantByIdUseCase);
        const tenantContext = context.container.resolve(TenantContext);

        const tenantResult = await getTenantById.execute(tenantId);
        if (tenantResult.isOk()) {
            tenantContext.setTenant(tenantResult.value);
        } else {
            // If there's no `root` tenant, it means system installation wasn't finished yet.
            // But all other tenants should throw an error.
            if (tenantId !== "root") {
                throw new Error("Unable to load tenant!");
            }

            // Mock root tenant so the system can bootstrap
            tenantContext.setTenant(RootTenantValue.create());
        }

        // Set up legacy context. We use this API in many places across our codebase, and this will provide
        // a working bridge until everything is migrated to use DI container.
        context.tenancy = new LegacyContext(context.container);
    });
};
