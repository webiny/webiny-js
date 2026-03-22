import { createAbstraction } from "@webiny/feature/api";
import type { SecurityPermission } from "~/types/security.js";
import { Identity } from "~/features/security/IdentityContext/index.js";

export interface IAuthorizationContext {
    loadPermissions(identity: Identity): Promise<SecurityPermission[]>;
    isAuthorizationEnabled(): boolean;
    withoutAuthorization<T>(cb: () => Promise<T>): Promise<T>;
    clearPermissionsCache(): void;
}

/** Load and cache security permissions for the current identity. */
export const AuthorizationContext =
    createAbstraction<IAuthorizationContext>("AuthorizationContext");

export namespace AuthorizationContext {
    export type Interface = IAuthorizationContext;
}

export interface IPermissionTransformer {
    execute(permission: SecurityPermission): SecurityPermission | SecurityPermission[];
}

/** Transform security permissions before they are applied. */
export const PermissionTransformer =
    createAbstraction<IPermissionTransformer>("PermissionTransformer");

export namespace PermissionTransformer {
    export type Interface = IPermissionTransformer;
    export type Permission = SecurityPermission;
    export type Return = SecurityPermission | SecurityPermission[];
}
