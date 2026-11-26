import type { Abstraction, Container } from "@webiny/di";
import type { KernelExecution } from "@webiny/api-kernel-core";
import { TenantScope, TenantScopeIdentity } from "./abstractions.js";
import type { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";
import type { Tenant } from "~/types/tenancy.js";

/**
 * One tenant's scope: its container and its execution frame. Built by `TenantScopes`, which
 * registers it in the scope's own container as `TenantScope`.
 */
export class TenantScopeImpl implements TenantScope.Interface {
    constructor(
        public readonly tenant: Tenant,
        public readonly storage: string,
        private readonly container: Container,
        private readonly execution: KernelExecution.Nested | undefined
    ) {}

    resolve<T>(abstraction: Abstraction<T>): T {
        return this.container.resolve(abstraction);
    }

    resolveAll<T>(abstraction: Abstraction<T>): T[] {
        return this.container.resolveAll(abstraction);
    }

    /** Runs `cb` in the scope's execution frame (outside a kernel execution, just runs it). */
    runInFrame<T>(cb: () => T): T {
        return this.execution ? this.execution.run(cb) : cb();
    }

    /** The scope's identity context, if its stack has one (a test's minimal stack may not). */
    getIdentityContext(): IdentityContext.Interface | undefined {
        return this.container.resolve(TenantScopeIdentity).identityContext;
    }
}
