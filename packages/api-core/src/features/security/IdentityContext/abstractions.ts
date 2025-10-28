import { createAbstraction } from "@webiny/feature/api";
import type { Identity } from "./Identity.js";
import type { SecurityPermission } from "~/types/security.js";

export interface IIdentityContext {
    // Identity methods
    getIdentity(): Identity;
    setIdentity(identity: Identity | undefined): void;
    withIdentity<T>(identity: Identity | undefined, cb: () => Promise<T>): Promise<T>;

    // Permission methods
    getPermission<TPermission extends SecurityPermission = SecurityPermission>(
        name: string
    ): Promise<TPermission | null>;

    getPermissions<TPermission extends SecurityPermission = SecurityPermission>(
        name: string
    ): Promise<TPermission[]>;

    listPermissions(): Promise<SecurityPermission[]>;

    hasFullAccess(): Promise<boolean>;

    // Authorization context methods
    withoutAuthorization<T>(cb: () => Promise<T>): Promise<T>;
    isAuthorizationEnabled(): boolean;
}

export const IdentityContext = createAbstraction<IIdentityContext>("IdentityContext");

export namespace IdentityContext {
    export type Interface = IIdentityContext;
}
