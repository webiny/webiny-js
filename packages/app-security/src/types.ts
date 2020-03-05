import * as React from "react";
import { Plugin } from "@webiny/app/types";
import { BindComponent } from "@webiny/form/Bind";

export type SecurityProviderHook = {
    getIdToken(): Promise<string | null>;
    renderAuthentication(params?: { viewProps: {} }): React.ReactElement;
    logout(): Promise<void>;
};

export type SecurityAuthenticationProviderPlugin = Plugin & {
    securityProviderHook(params: { onIdToken: (idToken: string) => void }): SecurityProviderHook;
};

export type SecureRouteErrorPlugin = Plugin & {
    render(): React.ReactElement;
};

export type SecurityViewProps = {
    Bind: BindComponent;
    data: { [key: string]: any };
    error?: any;
    fields: { [key: string]: React.ReactElement };
};

export type SecurityViewInstallationFormPlugin = Plugin & {
    view: React.ComponentType<SecurityViewProps>;
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
        | (() => Promise<SecurityScopesListPluginScope[]>);
};
