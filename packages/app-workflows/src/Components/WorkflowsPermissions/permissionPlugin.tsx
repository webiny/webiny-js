import React from "react";
import type { AdminAppPermissionRendererPlugin } from "@webiny/app-admin/types.js";
import { WorkflowsPermissions } from "./WorkflowsPermissions.js";

export const workflowsPermissions: AdminAppPermissionRendererPlugin = {
    type: "admin-app-permissions-renderer",
    name: "admin-app-permissions-renderer-workflows",
    render(props) {
        return <WorkflowsPermissions {...props} />;
    }
};
