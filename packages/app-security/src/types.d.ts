import * as React from "react";
import { Plugin } from "@webiny/app/types";
export declare type SecurityProviderHook = {
    getIdToken(): Promise<string | null>;
    renderAuthentication(params?: {
        viewProps: {};
    }): React.ReactElement;
    logout(): Promise<string>;
};
export declare type SecurityAuthenticationProvider = Plugin & {
    securityProviderHook(params: {
        onIdToken: (idToken: string) => void;
    }): SecurityProviderHook;
};
export declare type SecureRouteErrorPlugin = Plugin & {
    render(): React.ReactElement;
};
