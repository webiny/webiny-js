import React, { Fragment } from "react";
import { LoginScreenRenderer } from "@webiny/app-admin";
import { SelfHostedLoginScreen } from "./presentation/SelfHostedLoginScreen.js";

export interface SelfHostedLoginProps {
    passwordResetEnabled: boolean;
}

const createLoginScreenPlugin = (props: SelfHostedLoginProps) => {
    return LoginScreenRenderer.createDecorator(() => {
        return function SelfHostedLogin({ children }: { children: React.ReactNode }) {
            return (
                <SelfHostedLoginScreen passwordResetEnabled={props.passwordResetEnabled}>
                    {children}
                </SelfHostedLoginScreen>
            );
        };
    });
};

export const SelfHostedLogin = (props: SelfHostedLoginProps) => {
    const LoginScreenPlugin = createLoginScreenPlugin(props);

    return (
        <Fragment>
            <LoginScreenPlugin />
        </Fragment>
    );
};
