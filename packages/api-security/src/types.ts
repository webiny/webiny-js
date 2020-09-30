import { Plugin, Context } from "@webiny/graphql/types";

export type SecurityIdentity = {
    id: string;
    login: string;
    type: string;
    [key: string]: any;
};

export type SecurityAuthenticationPlugin = Plugin & {
    type: "security-authentication";
    authenticate(context: any): Promise<null> | Promise<SecurityIdentity>;
};

export type SecurityPermission = {
    name: string;
    [key: string]: any;
};

export type SecurityAuthorizationPlugin = Plugin & {
    type: "security-authorization";
    getPermissions(context: Context): Promise<SecurityPermission[]>;
};
