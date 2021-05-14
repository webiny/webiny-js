import { Plugin } from "@webiny/plugins/types";
import { ContextInterface } from "@webiny/handler/types";

export type SecurityIdentity = {
    id: string;
    displayName: string;
    type: string;
    [key: string]: any;
};

export type SecurityAuthenticationPlugin = Plugin & {
    type: "security-authentication";
    authenticate(context: ContextInterface): Promise<null> | Promise<SecurityIdentity>;
};

export interface SecurityPermission {
    name: string;
    [key: string]: any;
}

export interface SecurityAuthorizationPlugin extends Plugin {
    type: "security-authorization";
    getPermissions(context: SecurityContext): Promise<SecurityPermission[]>;
}

export interface SecurityContextBase {
    getIdentity: () => SecurityIdentity;
    getPermission: <TSecurityPermission = SecurityPermission>(
        name: string
    ) => Promise<TSecurityPermission>;
    getPermissions(): Promise<SecurityPermission[]>;
    hasFullAccess(): Promise<boolean>;
}

export interface SecurityContext extends ContextInterface {
    security: SecurityContextBase;
}

export interface FullAccessPermission {
    name: "*";
}
