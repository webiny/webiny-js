import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { CognitoFeature } from "./features/Cognito/CognitoFeature.js";
import { SignIn } from "./components/SignIn.js";
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

    const vm = presenter.vm;

    if (vm.checkingUser) {
        return <LoggingIn />;
    }

    switch (vm.authState) {
        case "signedIn":
            return <>{props.children}</>;

        case "requireNewPassword":
            return (
                <RequireNewPassword
                    vm={vm.requireNewPassword}
                    onSubmit={(password, attributes) =>
                        presenter.confirmNewPassword(password, attributes)
                    }
                    onCancel={() => presenter.showSignIn()}
                />
            );

        case "forgotPassword":
            return (
                <ForgotPassword
                    vm={vm.forgotPassword}
                    onSubmit={username => presenter.requestPasswordReset(username)}
                    onCancel={() => presenter.showSignIn()}
                />
            );

        case "setNewPassword":
            return (
                <SetNewPassword
                    vm={vm.setNewPassword}
                    onSubmit={(username, code, password) =>
                        presenter.confirmPasswordReset(username, code, password)
                    }
                    onCancel={() => presenter.showSignIn()}
                />
            );

        case "signIn":
        default:
            return (
                <SignIn
                    vm={vm.signIn}
                    onSubmit={(username, password) => presenter.signIn(username, password)}
                    onForgotPassword={() => presenter.showForgotPassword()}
                />
            );
    }
});
