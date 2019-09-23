import React from "react";
import Auth from "@aws-amplify/auth";
import Authentication from "./components/Authentication";

export default config => {
    // Configure Amplify Auth
    Auth.configure(config);

    return {
        name: "security-authentication-provider-cognito",
        type: "security-authentication-provider",
        hook({ onIdToken }) {
            const renderAuthentication = () => {
                return <Authentication onIdToken={onIdToken} />;
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
