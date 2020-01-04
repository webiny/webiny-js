import * as React from "react";
import { Plugin } from "@webiny/app/types";

export type SecurityProviderHook = {
    getIdToken(): Promise<string | null>;
    renderAuthentication(params?: { viewProps: {} }): React.ReactElement;
    logout(): Promise<string>;
}

export type SecurityAuthenticationProvider = Plugin & {
    securityProviderHook(params: { onIdToken: (idToken: string) => void }): SecurityProviderHook;
};

export type SecureRouteErrorPlugin = Plugin & {
    render(): React.ReactElement;
};
