import {
    type IWorkflowsSecurityPermission,
    WorkflowsSecurityPermissionAccessLevel
} from "~/types.js";
import { useSecurity } from "@webiny/app-security";
import { WORKFLOWS_PERMISSION } from "~/Components/WorkflowsPermissions/constants.js";

interface IHasAccessResponse {
    editor: boolean;
}

export const useWorkflowsPermission = (): IHasAccessResponse => {
    const { getPermission } = useSecurity();
    const permission = getPermission<IWorkflowsSecurityPermission>(WORKFLOWS_PERMISSION);
    if (!permission) {
        return {
            editor: false
        };
    } else if (permission.name === "*") {
        return {
            editor: true
        };
    }
    return {
        editor: permission.editor === WorkflowsSecurityPermissionAccessLevel.YES
    };
};
