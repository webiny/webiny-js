import type { AssumePermissionsContext } from "./abstractions.js";

/*
 * Kept in step by hand with ASSUME_PERMISSIONS_HEADER in @webiny/api-core, the same way
 * `x-tenant` is: the Admin cannot import a backend package.
 */
export const ASSUME_PERMISSIONS_HEADER = "x-webiny-assume-permissions";

export function assumePermissionsHeaderValue(value: AssumePermissionsContext.Value): string {
    return `${value.type}:${value.id}`;
}
