import * as React from "react";
import { Plugin } from "@webiny/plugins/types";
import { BindComponent } from "@webiny/form/Bind";
import { SecurityPermission } from "@webiny/app-security/SecurityIdentity";

export type UserManagementViewProps = {
    Bind: BindComponent;
    data: { [key: string]: any };
};

export type UserManagementInstallationFormPlugin = Plugin & {
    type: "user-management-installation-form";
    render(params: UserManagementViewProps): React.ReactNode;
};

export type UserManagementUserFormPlugin = Plugin & {
    type: "user-management-user-form";
    render(params: UserManagementViewProps): React.ReactNode;
};

export type UserManagementUserAccountFormPlugin = Plugin & {
    type: "user-management-user-account-form";
    render(params: UserManagementViewProps): React.ReactNode;
};

export type PermissionRendererSecurityPlugin = Plugin & {
    type: "permission-renderer-security";
    key: string;
    label: string;
    render: (
        value: SecurityPermission,
        setValue: (newValue: SecurityPermission) => void
    ) => React.ReactElement;
};
