import React from "react";
import Auth from "@aws-amplify/auth";
import debug from "../debug";
import { AuthChangeState, AuthProps } from "../Authenticator";

export type RequireNewPasswordChildrenProps = {
    authProps: AuthProps;
    confirm(params: {
        password: string;
        requiredAttributes: { [key: string]: string };
    }): Promise<void>;
    changeState: AuthChangeState;
    requiredAttributes: string[];
};

export type RequireNewPasswordProps = Omit<AuthProps, "checkingUser"> & {
    children: React.ReactElement;
};

class RequireNewPassword extends React.Component<RequireNewPasswordProps> {
    // States when this view should be visible
    authStates = ["requireNewPassword"];

    checkContact = user => {
        const { changeState } = this.props;
        Auth.verifiedContact(user).then(data => {
            if (data.verified) {
                changeState("signedIn", user);
            } else {
                changeState("verifyContact", { ...user, ...data });
            }
        });
    };

    confirm = async ({ password, ...requiredAttributes }) => {
        const { changeState, authData } = this.props;

        try {
            const user = await Auth.completeNewPassword(authData, password, requiredAttributes);
            debug("complete new password", user);
            if (user.challengeName === "SMS_MFA") {
                changeState("confirmSignIn", user);
            } else if (user.challengeName === "MFA_SETUP") {
                debug("TOTP setup", user.challengeParam);
                changeState("TOTPSetup", user);
            } else {
                this.checkContact(user);
            }
        } catch (err) {
            debug(err);
        }
    };

    render() {
        const { children, ...authProps } = this.props;
        const { authData, authState, changeState } = authProps;
        if (!this.authStates.includes(authState)) {
            return null;
        }

        return React.cloneElement(children, {
            authProps,
            confirm: this.confirm,
            changeState,
            requiredAttributes: authData.challengeParam.requiredAttributes || []
        } as RequireNewPasswordChildrenProps);
    }
}

export default RequireNewPassword;
