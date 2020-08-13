import { Plugin } from "@webiny/graphql/types";

export type SecurityIdentity = {
    id: string;
    login: string;
    type: string;
    hasPermission(permission: any): Promise<void>;
    [key: string]: any;
};

export type SecurityPlugin = Plugin & {
    type: "security";
    authenticate(context: any): Promise<null> | Promise<SecurityIdentity>;
};

export type AccessManagerMiddlewarePlugin = Plugin & {
    type: "access-manager-middleware";
    hasPermission(params: { identity: string; type: string; permission: any }): Promise<boolean>;
    getPermissions(params: { identity: string; type: string }): Promise<boolean>;
};
