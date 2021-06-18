import React from "react";
import {
    Authenticator,
    AuthenticatorProps
} from "@webiny/app-security-cognito-authentication/Authenticator";
import { View } from "@webiny/app/components/View";

import SignIn from "./views/SignIn";
import RequireNewPassword from "./views/RequireNewPassword";
import ForgotPassword from "./views/ForgotPassword";
import SetNewPassword from "./views/SetNewPassword";
import SignedIn from "./views/SignedIn";
import CheckingUser from "./views/CheckingUser";

export type Props = AuthenticatorProps;

export const Authentication = ({ children, getIdentityData }: Props) => {
    return (
        <Authenticator getIdentityData={getIdentityData}>
            <CheckingUser />
            <View name={"admin.authentication.signIn"}>
                <SignIn />
            </View>
            <RequireNewPassword />
            <ForgotPassword />
            <SetNewPassword />
            <SignedIn>{children}</SignedIn>
        </Authenticator>
    );
};
