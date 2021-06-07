import * as React from "react";
import { Plugin } from "@webiny/plugins/types";
import { BindComponent } from "@webiny/form/Bind";
import { SecurityPermission } from "@webiny/app-security/types";

export type SecurityViewProps = {
    Bind: BindComponent;
    data: { [key: string]: any };
};

export type Tenant = {
    id: string;
    name: string;
    group: string;
    permissions: SecurityPermission[];
};

export type SecurityInstallationFormPlugin = Plugin & {
    type: "security-installation-form";
    render(params: SecurityViewProps): React.ReactNode;
};

export type SecurityUserFormPlugin = Plugin & {
    type: "security-user-form";
    render(params: SecurityViewProps): React.ReactNode;
};

export type SecurityUserAccountFormPlugin = Plugin & {
    type: "security-user-account-form";
    render(params: SecurityViewProps): React.ReactNode;
};
