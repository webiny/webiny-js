import React from "react";

export const federatedIdentityProviders: Record<string, string> = {
    Cognito: "COGNITO",
    Google: "Google",
    Facebook: "Facebook",
    Amazon: "LoginWithAmazon",
    Apple: "SignInWithApple"
};

export interface SignInProps {
    signIn: () => void;
}

export type FederatedIdentityProvider = {
    name: string;
    component?: React.FunctionComponent<SignInProps>;
};
