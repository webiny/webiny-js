import React, { useMemo } from "react";
import { getPlugins } from "@webiny/plugins";
import Authenticator from "./cognito/Authenticator";
import SignInState from "./cognito/states/SignIn";
import RequireNewPasswordState from "./cognito/states/RequireNewPassword";
import ForgotPasswordState from "./cognito/states/ForgotPassword";
import SetNewPasswordState from "./cognito/states/SetNewPassword";

const Authentication = ({ onIdToken }) => {
    const {
        signIn: SignIn,
        requireNewPassword: RequireNewPassword,
        forgotPassword: ForgotPassword,
        setNewPassword: SetNewPassword,
        loading: Loading
    } = useMemo(() => {
        return getPlugins("cognito-view").reduce((acc, item) => {
            acc[item.viewType] = item.view;
            return acc;
        }, {});
    }, []);

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
