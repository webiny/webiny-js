import React from "react";
import { getPlugin } from "@webiny/plugins";
import { Authenticator } from "./cognito/Authenticator";
import SignInState from "./cognito/states/SignIn";
import RequireNewPasswordState from "./cognito/states/RequireNewPassword";
import ForgotPasswordState from "./cognito/states/ForgotPassword";
import SetNewPasswordState from "./cognito/states/SetNewPassword";
import invariant from "invariant";
import {
    SecurityCognitoViewForgotPasswordPlugin,
    SecurityCognitoViewLoadingPlugin,
    SecurityCognitoViewRequireNewPasswordPlugin,
    SecurityCognitoViewSetNewPasswordPlugin,
    SecurityCognitoViewSignInPlugin
} from "./types";

export type AuthenticationProps = {
    onIdToken(idToken: string): void;
    [key: string]: any;
};

const Authentication: React.FC<AuthenticationProps> = ({ onIdToken, ...viewProps }) => {
    const { view: SignIn } = getPlugin("cognito-view-sign-in") as SecurityCognitoViewSignInPlugin;
    invariant(SignIn, `Missing "cognito-view-sign-in" plugin!`);

    const { view: RequireNewPassword } = getPlugin(
        "cognito-view-require-new-password"
    ) as SecurityCognitoViewRequireNewPasswordPlugin;
    invariant(RequireNewPassword, `Missing "cognito-view-require-new-password" plugin!`);

    const { view: ForgotPassword } = getPlugin(
        "cognito-view-forgot-password"
    ) as SecurityCognitoViewForgotPasswordPlugin;
    invariant(ForgotPassword, `Missing "cognito-view-forgot-password" plugin!`);

    const { view: SetNewPassword } = getPlugin(
        "cognito-view-set-new-password"
    ) as SecurityCognitoViewSetNewPasswordPlugin;
    invariant(SetNewPassword, `Missing "cognito-view-set-new-password" plugin!`);

    const { view: Loading } = getPlugin("cognito-view-loading") as SecurityCognitoViewLoadingPlugin;
    invariant(Loading, `Missing "cognito-view-loading" plugin!`);

    return (
        <Authenticator onIdToken={onIdToken}>
            {({ checkingUser, ...authProps }) =>
                checkingUser ? (
                    <Loading />
                ) : (
                    <>
                        <SignInState {...authProps}>
                            <SignIn {...viewProps} />
                        </SignInState>
                        <RequireNewPasswordState {...authProps}>
                            <RequireNewPassword {...viewProps} />
                        </RequireNewPasswordState>
                        <ForgotPasswordState {...authProps}>
                            <ForgotPassword {...viewProps} />
                        </ForgotPasswordState>
                        <SetNewPasswordState {...authProps}>
                            <SetNewPassword {...viewProps} />
                        </SetNewPasswordState>
                    </>
                )
            }
        </Authenticator>
    );
};

export default Authentication;
