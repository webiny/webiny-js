import React, { Fragment } from "react";
import { LoginScreenRenderer } from "@webiny/app-admin";
import { SelfHostedLoginScreen } from "./presentation/SelfHostedLoginScreen.js";

export interface SelfHostedLoginProps {
    graphqlUrl: string;
}

const createLoginScreenPlugin = (graphqlUrl: string) => {
    return LoginScreenRenderer.createDecorator(() => {
        return function SelfHostedLogin({ children }: { children: React.ReactNode }) {
            return (
                <SelfHostedLoginScreen graphqlUrl={graphqlUrl}>{children}</SelfHostedLoginScreen>
            );
        };
    });
};

export const SelfHostedLogin = ({ graphqlUrl }: SelfHostedLoginProps) => {
    const LoginScreenPlugin = createLoginScreenPlugin(graphqlUrl);
    return (
        <Fragment>
            <LoginScreenPlugin />
        </Fragment>
    );
};
