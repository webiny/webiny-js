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
    /**
     * TODO @ts-refactor @pavel
     * Verify that login can be present in here.
     */
    login?: string;
    /**
     * TODO @ts-refactor @pavel
     * Verify that profile can be present in here.
     */
    profile?: {
        email?: string;
        firstName?: string;
        lastName?: string;
        avatar?: {
            src?: string;
        };
        gravatar?: string;
    };
    logout(): void;
    // For backwards compatibility, expose the `getPermission` method on the `identity` object.
    getPermission?<T extends SecurityPermission = SecurityPermission>(name: string): T | null;
    [key: string]: any;
}

export type IdToken = string;

export type IdTokenProvider = () => Promise<IdToken | undefined> | IdToken | undefined;
