import React from "react";
import SignInView from "./views/SignIn";
import ForgotPasswordView from "./views/ForgotPassword";
import RequireNewPasswordView from "./views/RequireNewPassword";
import SetNewPasswordView from "./views/SetNewPassword";
import { Loading, ViewContainer } from "./components/Layout";

export default ({ logo }) => [
    {
        name: "cognito-view-sign-in",
        type: "cognito-view",
        viewType: "signIn",
        view: function SignIn({ type, ...props }) {
            if (type === "compact") {
                return <SignInView {...props} />;
            }

            return (
                <ViewContainer logo={logo}>
                    <SignInView {...props} />
                </ViewContainer>
            );
        }
    },
    {
        name: "cognito-view-forgot-password",
        type: "cognito-view",
        viewType: "forgotPassword",
        view: function ForgotPassword({ type, ...props }) {
            if (type === "compact") {
                return <ForgotPasswordView {...props} />;
            }
            return (
                <ViewContainer logo={logo}>
                    <ForgotPasswordView {...props} />
                </ViewContainer>
            );
        }
    },
    {
        name: "cognito-view-require-new-password",
        type: "cognito-view",
        viewType: "requireNewPassword",
        view: function RequireNewPassword({ type, ...props }) {
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
        view: function SetNewPassword({ type, ...props }) {
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
