import type { SecurityPermission } from "@webiny/api-core/types/security.js";

/**
 * The `workflows` permission (spec 8, D54): `{ name: "workflows", editor?: true, reassign?: true }`;
 * full access is `workflows.*`. A missing flag means the action is not granted.
 */
export interface IWorkflowsSecurityPermission extends SecurityPermission {
    editor?: boolean;
    reassign?: boolean;
}
