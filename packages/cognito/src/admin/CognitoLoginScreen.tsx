import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { CognitoFeature } from "./features/Cognito/CognitoFeature.js";
import { SignIn } from "./components/SignIn.js";
import { SignedIn } from "./components/SignedIn.js";
import { RequireNewPassword } from "./components/RequireNewPassword.js";
import { ForgotPassword } from "./components/ForgotPassword.js";
import { SetNewPassword } from "./components/SetNewPassword.js";
import { LoggingIn } from "./components/LoggingIn.js";

export interface CognitoLoginScreenProps {
    region: string;
    userPoolId: string;
    clientId: string;
    children: React.ReactNode;
}

export const CognitoLoginScreen = observer((props: CognitoLoginScreenProps) => {
    const { presenter } = useFeature(CognitoFeature);

    useEffect(() => {
        presenter.init({
            region: props.region,
            userPoolId: props.userPoolId,
            clientId: props.clientId
        });
    }, []);

    const { authState, checkingUser } = presenter.vm;

    if (checkingUser) {
        return <LoggingIn />;
    }

    // Render appropriate view based on auth state
    switch (authState) {
        case "signedIn":
            return <SignedIn>{props.children}</SignedIn>;
        case "requireNewPassword":
            return <RequireNewPassword />;
        case "forgotPassword":
            return <ForgotPassword />;
        case "setNewPassword":
            return <SetNewPassword />;
        case "signIn":
        default:
            return <SignIn />;
    }
});
