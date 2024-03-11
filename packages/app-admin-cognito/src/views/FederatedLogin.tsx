import React from "react";
import styled from "@emotion/styled";
import { Auth, CognitoHostedUIIdentityProvider } from "@aws-amplify/auth";
import {
    FacebookLoginButton,
    GoogleLoginButton,
    AppleLoginButton,
    AmazonLoginButton
} from "react-social-login-buttons";
import { CognitoFederatedProvider } from "~/index";

const federatedButtons = {
    Facebook: FacebookLoginButton,
    Google: GoogleLoginButton,
    Amazon: AmazonLoginButton,
    Apple: AppleLoginButton,
    Cognito: () => null
};

const FederatedContainer = styled.div`
    border-top: 1px solid #ececec;
    padding-top: 20px;
`;

interface FederatedLoginProps {
    providers: CognitoFederatedProvider[];
}

export const FederatedLogin = ({ providers }: FederatedLoginProps) => {
    return (
        <FederatedContainer>
            {providers.map(provider => {
                const Button = provider in federatedButtons ? federatedButtons[provider] : null;

                return (
                    <Button
                        key={provider}
                        onClick={() =>
                            Auth.federatedSignIn({
                                provider:
                                    provider in CognitoHostedUIIdentityProvider
                                        ? CognitoHostedUIIdentityProvider[provider]
                                        : provider
                            })
                        }
                    />
                );
            })}
        </FederatedContainer>
    );
};
