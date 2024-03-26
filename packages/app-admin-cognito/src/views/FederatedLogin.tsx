import React from "react";
import { Auth } from "@aws-amplify/auth";
import { CognitoHostedUIIdentityProvider } from "@aws-amplify/auth/lib-esm/types/Auth";
import {
    federatedIdentityProviders,
    FederatedIdentityProvider
} from "~/federatedIdentityProviders";
import { FederatedProviders } from "~/components/FederatedProviders";

interface FederatedLoginProps {
    providers: FederatedIdentityProvider[];
}

export const FederatedLogin = ({ providers }: FederatedLoginProps) => {
    return (
        <FederatedProviders.Container>
            {providers.map(({ name, component: Component }) => {
                const cognitoProviderName = federatedIdentityProviders[name] ?? name;
                const isCustomProvider = !(name in federatedIdentityProviders);

                const signIn = () => {
                    if (isCustomProvider) {
                        Auth.federatedSignIn({
                            customProvider: cognitoProviderName
                        });
                    } else {
                        Auth.federatedSignIn({
                            provider: cognitoProviderName as CognitoHostedUIIdentityProvider
                        });
                    }
                };

                return <Component key={name} signIn={signIn} />;
            })}
        </FederatedProviders.Container>
    );
};
