import React from "react";
import { signInWithRedirect } from "aws-amplify/auth";
import { Button } from "@webiny/admin-ui";
import { makeDecoratable } from "@webiny/app-admin";
import type { FederatedProvider } from "~/admin/presentation/Cognito/CognitoSignInConfig.js";
import { federatedIdentityProviders } from "~/admin/federatedIdentityProviders.js";
import { FederatedProviders } from "./FederatedProviders.js";

type AuthProvider = "Amazon" | "Apple" | "Facebook" | "Google";

const builtInProviders = new Set<string>(["Amazon", "Apple", "Facebook", "Google"]);

export interface FederatedLoginProps {
    providers: FederatedProvider[];
}

export const FederatedLogin = makeDecoratable(
    "CognitoFederatedLogin",
    ({ providers }: FederatedLoginProps) => {
        return (
            <FederatedProviders.Container>
                {providers.map(provider => {
                    const cognitoProviderName =
                        federatedIdentityProviders[provider.name] ?? provider.name;
                    const isBuiltIn = builtInProviders.has(cognitoProviderName);

                    const signIn = () => {
                        if (isBuiltIn) {
                            signInWithRedirect({
                                provider: cognitoProviderName as AuthProvider
                            });
                        } else {
                            signInWithRedirect({
                                provider: { custom: cognitoProviderName }
                            });
                        }
                    };

                    if ("component" in provider) {
                        const Component = provider.component;
                        return <Component key={provider.name} signIn={signIn} />;
                    }

                    return (
                        <Button
                            key={provider.name}
                            text={provider.label}
                            onClick={signIn}
                            style={{ width: "100%" }}
                        />
                    );
                })}
            </FederatedProviders.Container>
        );
    }
);
