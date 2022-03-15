import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";

export type IdentityPermissions = [SecurityPermission[], SecurityIdentity | null][];
