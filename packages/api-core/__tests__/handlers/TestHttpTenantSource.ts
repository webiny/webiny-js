import type { InputChainRunner } from "@webiny/api-kernel-core";
import { TestHttpInputHandler } from "@webiny/api-kernel-core/features/testing";
import { InputTenantSource } from "~/features/tenancy/TenantScopes/index.js";

/** A test HTTP request runs in the tenant of its `x-tenant` header, or the root tenant without one. */
class TestHttpTenantSourceImpl implements InputTenantSource.Interface {
    getTenant(request: InputChainRunner.Request): InputTenantSource.Tenant | undefined {
        if (request.abstraction !== TestHttpInputHandler) {
            return undefined;
        }
        const headers: Record<string, string> = request.input?.headers ?? {};
        return { tenantId: headers["x-tenant"] || null };
    }
}

export const TestHttpTenantSource = InputTenantSource.createImplementation({
    implementation: TestHttpTenantSourceImpl,
    dependencies: []
});
