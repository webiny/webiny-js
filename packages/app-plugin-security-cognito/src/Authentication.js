// @flow
import * as React from "react";
import Authenticator from "./cognito/Authenticator";
import SignInState from "./cognito/states/SignIn";
import RequireNewPasswordState from "./cognito/states/RequireNewPassword";
import ForgotPasswordState from "./cognito/states/ForgotPassword";
import SetNewPasswordState from "./cognito/states/SetNewPassword";

const Authentication = ({ onIdToken, views }: Object) => {
    const { SignIn, RequireNewPassword, ForgotPassword, SetNewPassword, Loading } = views;

    return (
        <Authenticator onIdToken={onIdToken}>
            {({ checkingUser, ...authProps }) =>
                checkingUser ? (
                    <Loading />
                ) : (
                    <>
                        <SignInState {...authProps}>
                            <SignIn />
                        </SignInState>
                        <RequireNewPasswordState {...authProps}>
                            <RequireNewPassword />
                        </RequireNewPasswordState>
                        <ForgotPasswordState {...authProps}>
                            <ForgotPassword />
                        </ForgotPasswordState>
                        <SetNewPasswordState {...authProps}>
                            <SetNewPassword />
                        </SetNewPasswordState>
                    </>
                )
            }
        </Authenticator>
    );
};

export default Authentication;
