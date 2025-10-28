import { createAbstraction } from "@webiny/feature/api";
import type { SecurityPermission } from "~/types/security.js";

export interface IAuthorizationContext {
    loadPermissions(): Promise<SecurityPermission[]>;
    isAuthorizationEnabled(): boolean;
    withoutAuthorization<T>(cb: () => Promise<T>): Promise<T>;
    clearPermissionsCache(): void;
}

export const AuthorizationContext = createAbstraction<IAuthorizationContext>(
    "AuthorizationContext"
);

export namespace AuthorizationContext {
    export type Interface = IAuthorizationContext;
}
