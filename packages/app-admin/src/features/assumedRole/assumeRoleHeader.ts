import type { AssumedRoleContext } from "./abstractions.js";

/*
 * Kept in step by hand with ASSUME_ROLE_HEADER in @webiny/api-core, the same way `x-tenant` is:
 * the Admin cannot import a backend package.
 */
export const ASSUME_ROLE_HEADER = "x-webiny-assume-role";

export function assumeRoleHeaderValue(value: AssumedRoleContext.Value): string {
    return `${value.type}:${value.id}`;
}
