import React from "react";
import { Admin } from "@webiny/app-serverless-cms";
import { Cognito, CreateAuthenticationConfig } from "@webiny/app-admin-users-cognito";
import "./App.scss";

const cognitoConfig: CreateAuthenticationConfig = {
    oauth: {
        domain: String(process.env.REACT_APP_USER_POOL_DOMAIN),
        redirectSignIn: "http://localhost:3001",
        redirectSignOut: "http://localhost:3001",
        scope: ["profile", "email", "openid"],
        responseType: "token"
    },
    federatedProviders: [{ name: "MyIDP", element: <span>My IDP</span>}]
};

export const App: React.FC = () => {
    return (
        <Admin>
            <Cognito config={cognitoConfig} />
        </Admin>
    );
};
