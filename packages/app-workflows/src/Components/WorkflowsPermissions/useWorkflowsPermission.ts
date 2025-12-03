import {
    type IWorkflowsSecurityPermission,
    WorkflowsSecurityPermissionAccessLevel
} from "~/types.js";
import { useSecurity } from "@webiny/app-security";
import { WORKFLOWS_PERMISSION } from "~/Components/WorkflowsPermissions/constants.js";
import type { GenericRecord } from "@webiny/app/types.js";

interface IHasAccessResponse {
    editor: boolean;
}

/**
 * Force any permission property to be false by default.
 */
type AllFalse<T extends GenericRecord> = {
    [K in keyof T]: false;
};
const defaults: AllFalse<IHasAccessResponse> = {
    editor: false
};

export const useWorkflowsPermission = (): IHasAccessResponse => {
    const { getPermission } = useSecurity();
    const permission = getPermission<IWorkflowsSecurityPermission>(WORKFLOWS_PERMISSION);
    if (!permission) {
        return {
            ...defaults
        };
    } else if (permission.name === "*") {
        return {
            ...defaults,
            editor: true
        };
    }
    return {
        ...defaults,
        editor: permission.editor === WorkflowsSecurityPermissionAccessLevel.YES
    };
};
