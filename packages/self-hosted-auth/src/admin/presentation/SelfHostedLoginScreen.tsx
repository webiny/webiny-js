import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { OverlayLoader } from "@webiny/admin-ui";
import { SelfHostedAuthFeature } from "./feature.js";
import { SignIn } from "./components/SignIn.js";
import { RequestResetCode } from "./components/RequestResetCode.js";
import { ResetCodeSent } from "./components/ResetCodeSent.js";
import { SetNewPassword } from "./components/SetNewPassword.js";

/*
 * Login screen for the self-hosted IdP. Visually mirrors the Cognito sign-in screen, but instead of
 * Amplify it exchanges email/password for a JWT via the `selfHostedAuthLogin` GraphQL mutation,
 * then hands the token to app-admin's auth pipeline (LogInUseCase → sets the Bearer token provider
 * and fetches the identity/permissions via the shared LogInRepository).
 *
 * Four screens now rather than one, so the state machine lives in `SelfHostedAuthPresenter` and
 * this file is the switch over it.
 */

export { SELF_HOSTED_AUTH_TOKEN_KEY } from "./SelfHostedAuthPresenter.js";

export interface SelfHostedLoginScreenProps {
    graphqlUrl: string;
    /** Whether the project left the emailed reset flow on. Baked into the bundle at build time. */
    passwordResetEnabled: boolean;
    children: React.ReactNode;
}

export const SelfHostedLoginScreen = observer((props: SelfHostedLoginScreenProps) => {
    const { presenter } = useFeature(SelfHostedAuthFeature);

    useEffect(() => {
        presenter.init({
            graphqlUrl: props.graphqlUrl,
            passwordResetEnabled: props.passwordResetEnabled
        });
        // Once, on mount. `init` guards itself, since an effect re-runs on a hot reload.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const vm = presenter.vm;

    if (vm.isAuthenticated) {
        return <>{props.children}</>;
    }

    if (vm.checkingSession) {
        return <OverlayLoader text={"Checking session..."} />;
    }

    if (vm.screen === "requestResetCode") {
        return (
            <RequestResetCode
                vm={vm.requestResetCode}
                onRequestCode={email => presenter.requestResetCode(email)}
                onCancel={() => presenter.showSignIn()}
            />
        );
    }

    if (vm.screen === "resetCodeSent") {
        return (
            <ResetCodeSent
                vm={vm.resetCodeSent}
                onCodeAcquired={() => presenter.showSetNewPassword()}
                onResendCode={() => presenter.resendResetCode()}
                onCancel={() => presenter.showSignIn()}
            />
        );
    }

    if (vm.screen === "setNewPassword") {
        return (
            <SetNewPassword
                vm={vm.setNewPassword}
                onSetNewPassword={(code, password) => presenter.resetPassword(code, password)}
                onCancel={() => presenter.showSignIn()}
            />
        );
    }

    return (
        <SignIn
            vm={vm.signIn}
            onSubmit={(email, password) => presenter.signIn(email, password)}
            onForgotPassword={() => presenter.showRequestResetCode()}
        />
    );
});
