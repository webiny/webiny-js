import { createAbstraction } from "@webiny/feature/admin";

export interface IPermission {
    name: string;
    [key: string]: any;
}

export interface IIdentity {
    id: string;
    type: string;
    displayName: string;
    permissions?: IPermission[];
    profile?: {
        email?: string;
        firstName?: string;
        lastName?: string;
        avatar?: {
            src?: string;
        };
        gravatar?: string;
    };
}

export interface IIdentityContext {
    getIdentity(): IIdentity | undefined;
    setIdentity(identity: IIdentity | undefined): void;
    getPermission<T extends IPermission = IPermission>(name: string, exact?: boolean): T | null;
    getPermissions<T extends IPermission = IPermission>(name: string): T[];
}

export const IdentityContext = createAbstraction<IIdentityContext>("IdentityContext");

export namespace IdentityContext {
    export type Interface = IIdentityContext;
    export type Identity = IIdentity;
    export type Permission = IPermission;
}
