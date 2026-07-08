import type React from "react";
import { createAbstraction } from "@webiny/feature/admin";

export interface SignInProps {
    signIn: () => void;
}

export type IFederatedProvider =
    | { name: string; label: string }
    | { name: string; component: React.FC<SignInProps> };

export interface ICognitoSignInConfig {
    getConfig(): Promise<{
        oauth: {
            scopes: string[];
            redirectSignIn: string[];
            redirectSignOut: string[];
            responseType: "code" | "token";
        };
        allowCredentialsLogin: boolean;
        providers: IFederatedProvider[];
        title?: string;
        description?: string;
    }>;
}

export const CognitoSignInConfig = createAbstraction<ICognitoSignInConfig>("CognitoSignInConfig");

export namespace CognitoSignInConfig {
    export type Interface = ICognitoSignInConfig;
    export type Config = Awaited<ReturnType<ICognitoSignInConfig["getConfig"]>>;
    export type FederatedProvider = IFederatedProvider;
}
