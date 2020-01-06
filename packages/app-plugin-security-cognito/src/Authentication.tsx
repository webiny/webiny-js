import React from "react";
import { getPlugin } from "@webiny/plugins";
import Authenticator from "./cognito/Authenticator";
import SignInState from "./cognito/states/SignIn";
import RequireNewPasswordState from "./cognito/states/RequireNewPassword";
import ForgotPasswordState from "./cognito/states/ForgotPassword";
import SetNewPasswordState from "./cognito/states/SetNewPassword";

const Authentication = ({ onIdToken, ...viewProps }) => {
    const { view: SignIn } =
        getPlugin("cognito-view-sign-in") || throw Error(`Missing "cognito-view-sign-in" plugin!`);

    const { view: RequireNewPassword } =
        getPlugin("cognito-view-require-new-password") ||
        throw Error(`Missing "cognito-view-require-new-password" plugin!`);

    const { view: ForgotPassword } =
        getPlugin("cognito-view-forgot-password") ||
        throw Error(`Missing "cognito-view-forgot-password" plugin!`);

    const { view: SetNewPassword } =
        getPlugin("cognito-view-set-new-password") ||
        throw Error(`Missing "cognito-view-set-new-password" plugin!`);

    const { view: Loading } =
        getPlugin("cognito-view-loading") || throw Error(`Missing "cognito-view-loading" plugin!`);

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
