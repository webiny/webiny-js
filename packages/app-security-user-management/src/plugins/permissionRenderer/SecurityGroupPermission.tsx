import React from "react";
import { i18n } from "@webiny/app/i18n";
import { PermissionRendererSecurityPlugin } from "@webiny/app-security-user-management/types";
import { SimplePermissionRenderer } from "@webiny/app-security-user-management/components/permission";
import {
    createSimplePermissionInitialState,
    createSimplePermissionReducer
} from "@webiny/app-security-user-management/components/permission/utils";

export const SECURITY_GROUP_PERMISSION = "security.group.manage";

export const securityGroupPermissionInitialState = createSimplePermissionInitialState();

export const securityGroupPermissionReducer = createSimplePermissionReducer({
    initialState: securityGroupPermissionInitialState,
    permissionName: SECURITY_GROUP_PERMISSION
});

const t = i18n.ns("app-security-user-management/plugins/permissionRenderer/security-group");

export default () =>
    ({
        type: "permission-renderer-security",
        name: "permission-renderer-security-group",
        key: SECURITY_GROUP_PERMISSION,
        label: t`Groups`,
        render({ value, setValue }) {
            return (
                <SimplePermissionRenderer
                    value={value}
                    setValue={setValue}
                    label={t`Manage groups`}
                    permissionName={SECURITY_GROUP_PERMISSION}
                    initialState={securityGroupPermissionInitialState}
                    reducer={securityGroupPermissionReducer}
                />
            );
        }
    } as PermissionRendererSecurityPlugin);
