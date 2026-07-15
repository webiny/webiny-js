import type { IRequestContextInitializer } from "@webiny/event-handler-core";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
declare class SchedulerModelContextualSchemaImpl implements IRequestContextInitializer {
    private tenantCtx;
    private identityCtx;
    constructor(tenantCtx: TenantContext.Interface, identityCtx: IdentityContext.Interface);
    init(ctx: Record<string, any>): Promise<void>;
}
export declare const SchedulerModelContextualSchema: typeof SchedulerModelContextualSchemaImpl & {
    __abstraction: import("@webiny/di").Abstraction<IRequestContextInitializer>;
};
export {};
