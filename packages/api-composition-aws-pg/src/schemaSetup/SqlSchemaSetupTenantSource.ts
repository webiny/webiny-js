import type { InputChainRunner } from "@webiny/api-kernel-core";
import { InputTenantSource } from "@webiny/api-core/features/tenancy/TenantScopes/index.js";
import { SqlSchemaSetupInputHandler } from "./abstractions.js";

/**
 * The schema setup runs in no tenant: it runs before any tenant (or the tenants table) exists, and
 * builds its own container on the setup's connection.
 */
class SqlSchemaSetupTenantSourceImpl implements InputTenantSource.Interface {
    getTenant(request: InputChainRunner.Request): InputTenantSource.Tenant | undefined {
        return request.abstraction === SqlSchemaSetupInputHandler ? "tenant-neutral" : undefined;
    }
}

export const SqlSchemaSetupTenantSource = InputTenantSource.createImplementation({
    implementation: SqlSchemaSetupTenantSourceImpl,
    dependencies: []
});
