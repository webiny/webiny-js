import type { SecurityPermission } from "@webiny/api-security/types.js";

export interface IListPermissionsGateway {
    execute: () => Promise<SecurityPermission[]>;
}
