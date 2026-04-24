import React, { Fragment } from "react";
import { LoginScreenRenderer } from "@webiny/app-admin";
import {
    CognitoLoginScreen,
    type CognitoLoginScreenProps
} from "./presentation/Cognito/CognitoLoginScreen.js";

const createLoginScreenPlugin = (params: Omit<CognitoLoginScreenProps, "children">) => {
    return LoginScreenRenderer.createDecorator(() => {
        return function CognitoLogin({ children }) {
            return <CognitoLoginScreen {...params}>{children}</CognitoLoginScreen>;
        };
    });
};

export interface CognitoLoginProps {
    region: string;
    userPoolId: string;
    clientId: string;
}

export const CognitoLogin = (props: CognitoLoginProps) => {
    const LoginScreenPlugin = createLoginScreenPlugin(props);
    return (
        <Fragment>
            <LoginScreenPlugin />
        </Fragment>
    );
};
