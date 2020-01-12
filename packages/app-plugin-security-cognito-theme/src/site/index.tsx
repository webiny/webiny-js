import React from "react";
import SignInView from "./views/SignIn";
import ForgotPasswordView from "./views/ForgotPassword";
import RequireNewPasswordView from "./views/RequireNewPassword";
import SetNewPasswordView from "./views/SetNewPassword";
import { Loading, ViewContainer } from "./components/Layout";
import {
    ForgotPasswordChildrenProps,
    RequireNewPasswordChildrenProps,
    SecurityCognitoViewForgotPasswordPlugin,
    SecurityCognitoViewSignInPlugin,
    SetNewPasswordChildrenProps,
    SignInChildrenProps
} from "@webiny/app-plugin-security-cognito/types";

export default ({ logo }) => [
    {
        name: "cognito-view-sign-in",
        type: "cognito-view",
        viewType: "signIn",
        view: function SignIn({ type, ...props }: SignInChildrenProps & { type?: string }) {
            if (type === "compact") {
                return <SignInView {...props} />;
            }

            return (
                <ViewContainer logo={logo}>
                    <SignInView {...props} />
                </ViewContainer>
            );
        }
    } as SecurityCognitoViewSignInPlugin,
    {
        name: "cognito-view-forgot-password",
        type: "cognito-view",
        viewType: "forgotPassword",
        view: function ForgotPassword({
            type,
            ...props
        }: ForgotPasswordChildrenProps & { type?: string }) {
            if (type === "compact") {
                return <ForgotPasswordView {...props} />;
            }
            return (
                <ViewContainer logo={logo}>
                    <ForgotPasswordView {...props} />
                </ViewContainer>
            );
        }
    } as SecurityCognitoViewForgotPasswordPlugin,
    {
        name: "cognito-view-require-new-password",
        type: "cognito-view",
        viewType: "requireNewPassword",
        view: function RequireNewPassword({
            type,
            ...props
        }: RequireNewPasswordChildrenProps & { type?: string }) {
            if (type === "compact") {
                return <RequireNewPasswordView {...props} />;
            }

            return (
                <ViewContainer logo={logo}>
                    <RequireNewPasswordView {...props} />
                </ViewContainer>
            );
        }
    },
    {
        name: "cognito-view-set-new-password",
        type: "cognito-view",
        viewType: "setNewPassword",
        view: function SetNewPassword({
            type,
            ...props
        }: SetNewPasswordChildrenProps & { type?: string }) {
            if (type === "compact") {
                return <SetNewPasswordView {...props} />;
            }
            return (
                <ViewContainer logo={logo}>
                    <SetNewPasswordView {...props} />
                </ViewContainer>
            );
        }
    },
    {
        name: "cognito-view-loading",
        type: "cognito-view",
        viewType: "loading",
        view: Loading
    }
];
