import React from "react";
import { signInWithRedirect } from "aws-amplify/auth";
import type { FederatedIdentityProvider } from "~/admin/federatedIdentityProviders.js";
import { federatedIdentityProviders } from "~/admin/federatedIdentityProviders.js";
import { FederatedProviders } from "./FederatedProviders.js";

type AuthProvider = "Amazon" | "Apple" | "Facebook" | "Google";

const builtInProviders = new Set<string>(["Amazon", "Apple", "Facebook", "Google"]);

interface FederatedLoginProps {
    providers: FederatedIdentityProvider[];
}

export const FederatedLogin = ({ providers }: FederatedLoginProps) => {
    return (
        <FederatedProviders.Container>
            {providers.map(({ name, component: Component }) => {
                const cognitoProviderName = federatedIdentityProviders[name] ?? name;
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

                return <Component key={name} signIn={signIn} />;
            })}
        </FederatedProviders.Container>
    );
};
