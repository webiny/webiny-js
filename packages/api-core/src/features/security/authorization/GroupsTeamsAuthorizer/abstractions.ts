import { createAbstraction } from "@webiny/feature/api";
import type { SecurityPermission } from "~/types/security.js";
import { Identity } from "~/features/security/IdentityContext/index.js";

export interface ITenantPermission extends SecurityPermission {
    _src: string;
}

export interface IPermissionsProcessor {
    getPermissions(identity: Identity): Promise<ITenantPermission[] | null>;
}

export const PermissionsProcessor =
    createAbstraction<IPermissionsProcessor>("PermissionsProcessor");

export namespace PermissionsProcessor {
    export type Interface = IPermissionsProcessor;
    export type Permissions = ITenantPermission[];
}
