import { createImplementation } from "@webiny/feature/api";
import { TenantScopeIdentity as Abstraction_ } from "./abstractions.js";
import { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";

class TenantScopeIdentityImpl implements Abstraction_.Interface {
    constructor(public readonly identityContext: IdentityContext.Interface | undefined) {}
}

export const TenantScopeIdentity = createImplementation({
    abstraction: Abstraction_,
    implementation: TenantScopeIdentityImpl,
    dependencies: [[IdentityContext, { optional: true }]]
});
