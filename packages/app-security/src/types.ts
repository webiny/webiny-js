import { Plugin } from "@webiny/app/types";

export type SecureRouteErrorPlugin = Plugin & {
    render(): React.ReactElement;
};

export interface FullAccessPermission {
    name: "*";
}

export interface SecurityPermission {
    name: string;
    [key: string]: any;
}

export interface SecurityIdentity {
    id: string;
    type: string;
    displayName: string;
    permissions?: SecurityPermission[];
    logout(): void;
    // For backwards compatibility, expose the `getPermission` method on the `identity` object.
    getPermission?<T extends SecurityPermission = SecurityPermission>(name: string): T | null;
    [key: string]: any;
}
