import React from "react";
import Auth from "@aws-amplify/auth";
import Authentication from "./Authentication";
import { SecurityAuthenticationProviderPlugin } from "@webiny/app-security/types";

const factory = (config): SecurityAuthenticationProviderPlugin => {
    // Configure Amplify Auth
    Auth.configure(config);

    return {
        name: "security-authentication-provider-cognito",
        type: "security-authentication-provider",
        securityProviderHook({ onIdToken }) {
            const renderAuthentication = ({ viewProps = {} } = {}) => {
                return <Authentication onIdToken={onIdToken} {...viewProps} />;
            };

            const logout = async () => {
                await Auth.signOut();
            };

            const getIdToken = async () => {
                const cognitoUser = await Auth.currentSession();
                const idToken = cognitoUser.getIdToken();
                return cognitoUser ? idToken.getJwtToken() : null;
            };

            return { getIdToken, renderAuthentication, logout };
        }
    };
};

export default factory;