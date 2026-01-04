import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { OverlayLoader } from "@webiny/admin-ui";
import { CognitoFeature } from "./feature.js";
import { SignIn } from "./components/SignIn.js";
import { RequireNewPassword } from "./components/RequireNewPassword.js";
import { RequestPasswordResetCode } from "./components/RequestPasswordResetCode.js";
import { SetNewPassword } from "./components/SetNewPassword.js";
import { PasswordResetCodeSent } from "~/admin/presentation/Cognito/components/PasswordResetCodeSent.js";

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

                    {vm.authState === "requestPasswordResetCode" && (
                        <RequestPasswordResetCode
                            vm={vm.requestPasswordResetCode}
                            onRequestCode={username => presenter.requestPasswordReset(username)}
                            onCancel={() => presenter.showSignIn()}
                        />
                    )}

                    {vm.authState === "passwordResetCodeSent" && (
                        <PasswordResetCodeSent
                            vm={vm.passwordResetCodeSent}
                            onResendCode={() => presenter.resendPasswordResetCode()}
                            onCodeAcquired={() => presenter.showSetNewPassword()}
                            onCancel={() => presenter.showSignIn()}
                        />
                    )}

                    {vm.authState === "setNewPassword" && (
                        <SetNewPassword
                            vm={vm.setNewPassword}
                            onSetNewPassword={(code, password) =>
                                presenter.confirmPasswordReset(code, password)
                            }
                            onCancel={() => presenter.showSignIn()}
                        />
                    )}

                    {(vm.authState === "signIn" || vm.authState === "signedOut") && (
                        <SignIn
                            vm={vm.signIn}
                            onSubmit={(username, password) => presenter.signIn(username, password)}
                            onForgotPassword={() => presenter.showRequestPasswordResetCode()}
                        />
                    )}
                </>
            ) : null}
        </>
    );
});
