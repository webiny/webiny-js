import type { Abstraction } from "@webiny/di";
import type { InputChainRunner, InputHandler } from "@webiny/api-kernel-core";
import { InputTenantSource } from "@webiny/api-core/features/tenancy/TenantScopes/index.js";

/**
 * An HTTP transport's handler chain runs at request level, in no tenant's scope: the HTTP router
 * answers a CORS preflight there, and enters the request's tenant scope itself, once the tenant is
 * loaded (`HttpTenantScopeRouter`).
 */
export class HttpInputTenantSource implements InputTenantSource.Interface {
    constructor(private readonly inputHandler: Abstraction<InputHandler.Interface>) {}

    getTenant(request: InputChainRunner.Request): InputTenantSource.Tenant | undefined {
        return request.abstraction === this.inputHandler ? "tenant-neutral" : undefined;
    }
}
