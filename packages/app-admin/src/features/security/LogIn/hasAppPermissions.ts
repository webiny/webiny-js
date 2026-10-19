import type { Identity } from "~/domain/Identity.js";

/*
 * `aacl` is granted to every identity that can reach the Admin, so it says nothing about whether
 * the identity can use any app. An identity with nothing else cannot log in.
 */
export function hasAppPermissions(identity: Identity): boolean {
    const permissions = identity.getPermissions();
    const appPermissions = permissions.filter(permission => permission.name !== "aacl");

    return appPermissions.length > 0;
}
