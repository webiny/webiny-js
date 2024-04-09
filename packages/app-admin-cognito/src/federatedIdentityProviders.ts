import React from "react";

export const federatedIdentityProviders: Record<string, string> = {
    cognito: "COGNITO",
    google: "Google",
    facebook: "Facebook",
    amazon: "LoginWithAmazon",
    apple: "SignInWithApple"
};

export interface SignInProps {
    signIn: () => void;
}

export type FederatedIdentityProvider = {
    name: string;
    component: React.FunctionComponent<SignInProps>;
};
