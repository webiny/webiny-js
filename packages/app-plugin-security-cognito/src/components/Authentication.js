// @flow
import * as React from "react";
import Authenticator from "./cognito/Authenticator";
import SignIn from "./states/SignIn";
import RequireNewPassword from "./states/RequireNewPassword";
import ForgotPassword from "./states/ForgotPassword";
import SetNewPassword from "./states/SetNewPassword";
import { CircularProgress } from "@webiny/ui/Progress";

const Authentication = ({ onIdToken }: Object) => {
    return (
        <Authenticator onIdToken={onIdToken}>
            {({ checkingUser, ...authProps }) =>
                checkingUser ? (
                    <CircularProgress />
                ) : (
                    <>
                        <SignIn {...authProps} />
                        <RequireNewPassword {...authProps} />
                        <ForgotPassword {...authProps} />
                        <SetNewPassword {...authProps} />
                    </>
                )
            }
        </Authenticator>
    );
};

export default Authentication;
