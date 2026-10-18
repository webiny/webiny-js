import { Identity } from "@webiny/app-admin/domain/Identity.js";

// The stored `workflows` permission (R259): booleans, one entry per role.
export interface IWorkflowsSecurityPermission extends Identity.Permission {
    editor?: boolean;
    reassign?: boolean;
}
