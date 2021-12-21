import { Compose, LoginScreenRenderer } from "@webiny/app-admin";
import React from "react";
import { createAuthentication } from "~/createAuthentication";

const LoginScreen = createAuthentication();

const CognitoLoginScreen = () => LoginScreen;

export const Cognito = () => {
    return <Compose component={LoginScreenRenderer} with={CognitoLoginScreen} />;
};
