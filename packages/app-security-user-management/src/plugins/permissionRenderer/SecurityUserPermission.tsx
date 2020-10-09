import React from "react";
import { i18n } from "@webiny/app/i18n";
import { PermissionRendererSecurityPlugin } from "@webiny/app-security-user-management/types";
import { SimplePermissionRenderer } from "@webiny/app-security-user-management/components/permission";
import {
    createSimplePermissionInitialState,
    createSimplePermissionReducer
} from "@webiny/app-security-user-management/components/permission/utils";

export const SECURITY_USER_PERMISSION = "security.user.manage";

export const securityUserPermissionInitialState = createSimplePermissionInitialState();

export const securityUserPermissionReducer = createSimplePermissionReducer({
    initialState: securityUserPermissionInitialState,
    permissionName: SECURITY_USER_PERMISSION
});

const t = i18n.ns("app-security-user-management/plugins/permissionRenderer/security-user");

export default () =>
    ({
        type: "permission-renderer-security",
        name: "permission-renderer-security-user",
        key: SECURITY_USER_PERMISSION,
        label: t`Users`,
        render({ value, setValue }) {
            return (
                <SimplePermissionRenderer
                    value={value}
                    setValue={setValue}
                    label={t`Manage users`}
                    permissionName={SECURITY_USER_PERMISSION}
                    initialState={securityUserPermissionInitialState}
                    reducer={securityUserPermissionReducer}
                />
            );
        }
    } as PermissionRendererSecurityPlugin);
