import React from "react";
import { plugins } from "@webiny/plugins";
import { PermissionRendererSecurityPlugin } from "@webiny/app-security-user-management/types";
import { AppPermissionsRenderer } from "@webiny/app-security-user-management/components/permission";
import { reducer, initialState, permissionLevelOptions, fullAccessPermissionName } from "../utils";

const SecurityPermissions = ({ value, onChange }) => {
    const permissionRendererPlugins = plugins.byType<PermissionRendererSecurityPlugin>(
        "permission-renderer-security"
    );
    return (
        <AppPermissionsRenderer
            value={value}
            onChange={onChange}
            fullAccessPermissionName={fullAccessPermissionName}
            initialState={initialState}
            reducer={reducer}
            permissionLevelOptions={permissionLevelOptions}
            permissionRendererPlugins={permissionRendererPlugins}
        />
    );
};

export default SecurityPermissions;
