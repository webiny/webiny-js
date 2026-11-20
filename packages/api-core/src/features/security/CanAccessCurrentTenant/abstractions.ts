import { createAbstraction } from "@webiny/feature/api";

export interface ICanAccessCurrentTenantUseCase {
    execute(): Promise<boolean>;
}

/**
 * Whether the current identity may access the current tenant: it is not anonymous and has at least
 * one permission there. For entry points where the client names the tenant and nothing else stops a
 * valid token from being used in a tenant it has no access to, such as a websocket connect.
 */
export const CanAccessCurrentTenantUseCase = createAbstraction<ICanAccessCurrentTenantUseCase>(
    "Security/CanAccessCurrentTenantUseCase"
);

export namespace CanAccessCurrentTenantUseCase {
    export type Interface = ICanAccessCurrentTenantUseCase;
}
