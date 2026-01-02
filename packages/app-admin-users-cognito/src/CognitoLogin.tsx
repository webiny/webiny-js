import React, { useMemo } from "react";
import type { CreateAuthenticationConfig } from "~/createAuthentication/index.js";
import { createAuthentication } from "~/createAuthentication/index.js";
import {  LoginScreenRenderer } from "@webiny/app-admin";

const createLoginScreenDecorator = (config?: CreateAuthenticationConfig) => {
    const LoginComponent = createAuthentication(config);
    return LoginScreenRenderer.createDecorator(() => {
        return function LoginScreen({ children }) {
            return <LoginComponent>{children}</LoginComponent>;
        };
    });
};


export interface CognitoProps {
    config?: CreateAuthenticationConfig;
}

export const CognitoLogin = ({ config }: CognitoProps) => {
    const LoginScreenDecorator = useMemo(() => createLoginScreenDecorator(config), []);

    return (
        <>
            <LoginScreenDecorator />
        </>
    );
};
