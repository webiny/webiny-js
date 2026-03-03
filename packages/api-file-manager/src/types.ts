import type { SecurityPermission } from "@webiny/api-core/types/security.js";

export interface FilePermission extends SecurityPermission {
    name: "fm.file";
    rwd?: string;
    own?: boolean;
}
