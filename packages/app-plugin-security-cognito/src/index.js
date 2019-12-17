import React from "react";
import Auth from "@aws-amplify/auth";
import Authentication from "./Authentication";

export default config => {
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
                return cognitoUser ? cognitoUser.idToken.jwtToken : null;
            };

            return { getIdToken, renderAuthentication, logout };
        }
    };
};
