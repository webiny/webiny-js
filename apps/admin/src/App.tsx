import React from "react";
import { Admin } from "@webiny/app-serverless-cms";
import { Cognito, CreateAuthenticationConfig, Components } from "@webiny/app-admin-users-cognito";
import "./App.scss";
import { ButtonPrimary } from "@webiny/ui/Button";

const cognitoConfig: CreateAuthenticationConfig = {
    oauth: {
        domain: String(process.env.REACT_APP_USER_POOL_DOMAIN),
        redirectSignIn: "http://localhost:3001",
        redirectSignOut: "http://localhost:3001",
        scope: ["profile", "email", "openid"],
        responseType: "token"
    },
    federatedProviders: [
        {
            name: "MyIDP",
            component: ({ signIn }) => (
                <ButtonPrimary onClick={() => signIn()}>Sign in via My IDP</ButtonPrimary>
            )
        }
    ]
};

const TitleDecorator = Components.View.Title.createDecorator(Original => {
    return function Title(props) {
        return <Original {...props} title={`[${props.title}]`} />;
    };
});

const SignInDecorator = Components.SignIn.createDecorator(Original => {
    return function SignIn(props) {
        return <Original {...props} allowSignInWithCredentials={false} />;
    };
});

export const App: React.FC = () => {
    return (
        <Admin>
            <Cognito config={cognitoConfig} />
            <TitleDecorator />
            <SignInDecorator />
        </Admin>
    );
};
