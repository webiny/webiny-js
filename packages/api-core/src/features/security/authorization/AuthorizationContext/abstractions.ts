import { createAbstraction } from "@webiny/feature/api";
import type { SecurityPermission } from "~/types/security.js";
import { Identity } from "~/features/security/IdentityContext/index.js";

export interface IAuthorizationContext {
    loadPermissions(identity: Identity): Promise<SecurityPermission[]>;
    isAuthorizationEnabled(): boolean;
    withoutAuthorization<T>(cb: () => Promise<T>): Promise<T>;
    clearPermissionsCache(): void;
}

export const AuthorizationContext =
    createAbstraction<IAuthorizationContext>("AuthorizationContext");

export namespace AuthorizationContext {
    export type Interface = IAuthorizationContext;
}
