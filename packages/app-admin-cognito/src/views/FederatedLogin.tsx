import React from "react";
import { Auth } from "@aws-amplify/auth";
import { CognitoHostedUIIdentityProvider } from "@aws-amplify/auth/lib-esm/types/Auth";
import {
    FacebookLoginButton,
    GoogleLoginButton,
    AppleLoginButton,
    AmazonLoginButton
} from "react-social-login-buttons";
import {
    federatedIdentityProviders,
    FederatedIdentityProvider
} from "~/federatedIdentityProviders";
import { FederatedProviders } from "~/components/FederatedProviders";

const federatedButtons: Record<string, React.ComponentType> = {
    Facebook: FacebookLoginButton,
    Google: GoogleLoginButton,
    Amazon: AmazonLoginButton,
    Apple: AppleLoginButton
};

interface FederatedLoginProps {
    providers: FederatedIdentityProvider[];
}

export const FederatedLogin = ({ providers }: FederatedLoginProps) => {
    return (
        <FederatedProviders.Container>
            {providers.map(({ name, component }) => {
                const Component = component ?? federatedButtons[name] ?? (() => null);
                const cognitoProviderName = federatedIdentityProviders[name] ?? name;
                const isCustomProvider = !(name in federatedIdentityProviders);

                return (
                    <Component
                        key={name}
                        signIn={() => {
                            if (isCustomProvider) {
                                Auth.federatedSignIn({
                                    customProvider: cognitoProviderName
                                });
                            } else {
                                Auth.federatedSignIn({
                                    provider: cognitoProviderName as CognitoHostedUIIdentityProvider
                                });
                            }
                        }}
                    />
                );
            })}
        </FederatedProviders.Container>
    );
};
