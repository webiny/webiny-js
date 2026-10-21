import { useSecurity } from "@webiny/app-admin";
import { getWorkflowsPermissionSet } from "~/review/domain/getWorkflowsPermissionSet.js";

interface IHasAccessResponse {
    editor: boolean;
    reassign: boolean;
}

/*
 * The viewer's workflows permissions (R259). The hook only reads the identity; the rules live in
 * `getWorkflowsPermissionSet`, which also handles several roles, `workflows.*` and `*`.
 */
export const useWorkflowsPermission = (): IHasAccessResponse => {
    const { identity } = useSecurity();
    const permissions = getWorkflowsPermissionSet(identity);

    return { editor: permissions.editor, reassign: permissions.reassign };
};
