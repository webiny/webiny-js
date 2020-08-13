import * as React from "react";
import { Plugin } from "@webiny/app/types";
import { BindComponent } from "@webiny/form/Bind";

export type SecurityPlugin = Plugin & {
    type: "security";
    render(params: any): React.ReactNode;
};

// TODO: REVIEW AND MOVE

export type SecurityViewProps = {
    Bind: BindComponent;
    data: { [key: string]: any };
    error?: any;
    fields: { [key: string]: React.ReactElement };
};

export type SecurityViewInstallationFormPlugin = Plugin & {
    view: React.ComponentType<SecurityViewProps>;
    onSubmit?(params: { data: { [key: string]: any } }): Promise<void>;
};

export type SecurityViewUserFormPlugin = Plugin & {
    view: React.ComponentType<SecurityViewProps>;
};

export type SecurityViewUserAccountFormPlugin = Plugin & {
    view: React.ComponentType<SecurityViewProps>;
};

type SecurityScopesListPluginScope = {
    title: any;
    description: any;
    scope: string;
};

/**
 * Enables adding custom security scopes to the multi-select autocomplete component in the Roles form.
 * @see https://docs.webiny.com/docs/webiny-apps/security/development/plugin-reference/app/#security-scopes-list
 */
export type SecurityScopesListPlugin = Plugin & {
    type: "security-scopes-list";
    scopes:
        | SecurityScopesListPluginScope[]
        | (() => SecurityScopesListPluginScope[])
        | (({ apolloClient }) => Promise<SecurityScopesListPluginScope[]>);
};
