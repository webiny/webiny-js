import * as React from "react";
import { Plugin } from "@webiny/app/types";

export { SetNewPasswordChildrenProps } from "./cognito/states/SetNewPassword";
export { ForgotPasswordChildrenProps } from "./cognito/states/ForgotPassword";
export { RequireNewPasswordChildrenProps } from "./cognito/states/RequireNewPassword";
export { SignInChildrenProps } from "./cognito/states/SignIn";

export type SecurityCognitoViewPlugin = Plugin & {
    view: React.ComponentType<any>;
};

export type SecurityCognitoViewSignInPlugin = SecurityCognitoViewPlugin & {
    name: "cognito-view-sign-in";
};

export type SecurityCognitoViewRequireNewPasswordPlugin = SecurityCognitoViewPlugin & {
    name: "cognito-view-require-new-password";
};

export type SecurityCognitoViewForgotPasswordPlugin = SecurityCognitoViewPlugin & {
    name: "cognito-view-forgot-password";
};

export type SecurityCognitoViewSetNewPasswordPlugin = SecurityCognitoViewPlugin & {
    name: "cognito-view-set-new-password";
};

export type SecurityCognitoViewLoadingPlugin = SecurityCognitoViewPlugin & {
    name: "cognito-view-loading";
};
