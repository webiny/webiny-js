import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { OverlayLoader } from "@webiny/admin-ui";
import { CognitoFeature } from "./features/Cognito/CognitoFeature.js";
import { SignIn } from "./components/SignIn.js";
import { RequireNewPassword } from "./components/RequireNewPassword.js";
import { ForgotPassword } from "./components/ForgotPassword.js";
import { SetNewPassword } from "./components/SetNewPassword.js";

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

    if (vm.isAuthenticated) {
        return <>{props.children}</>;
    }

    return (
        <>
            {vm.isLoggingIn ? <OverlayLoader text={"Signing in..."} /> : null}
            {vm.checkingSession ? <OverlayLoader text={"Checking session..."} /> : null}

            {!vm.isLoggingIn && !vm.checkingSession ? (
                <>
                    {vm.authState === "requireNewPassword" && (
                        <RequireNewPassword
                            vm={vm.requireNewPassword}
                            onSubmit={(password, attributes) =>
                                presenter.confirmNewPassword(password, attributes)
                            }
                            onCancel={() => presenter.showSignIn()}
                        />
                    )}

                    {vm.authState === "forgotPassword" && (
                        <ForgotPassword
                            vm={vm.forgotPassword}
                            onSubmit={username => presenter.requestPasswordReset(username)}
                            onCancel={() => presenter.showSignIn()}
                        />
                    )}

                    {vm.authState === "setNewPassword" && (
                        <SetNewPassword
                            vm={vm.setNewPassword}
                            onSubmit={(username, code, password) =>
                                presenter.confirmPasswordReset(username, code, password)
                            }
                            onCancel={() => presenter.showSignIn()}
                        />
                    )}

                    {(vm.authState === "signIn" || vm.authState === "signedOut") && (
                        <SignIn
                            vm={vm.signIn}
                            onSubmit={(username, password) => presenter.signIn(username, password)}
                            onForgotPassword={() => presenter.showForgotPassword()}
                        />
                    )}
                </>
            ) : null}
        </>
    );
});
