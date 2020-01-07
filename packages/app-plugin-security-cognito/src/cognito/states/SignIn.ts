import React from "react";
import Auth from "@aws-amplify/auth";
import debug from "../debug";
import { AuthChangeState, AuthProps, AuthState } from "../Authenticator";

export type SignInChildrenProps = {
    authProps: AuthProps;
    signIn(params: { username: string; password: string }): void;
    changeState: AuthChangeState;
    error: Error;
    loading: boolean;
};

export type SignInProps = Omit<AuthProps, "checkingUser"> & {
    children: React.ReactElement;
};

class SignIn extends React.Component<SignInProps> {
    // States when this view should be visible
    authStates: AuthState[] = ["signIn", "signedOut", "signedUp"];

    state = {
        error: null,
        loading: false
    };

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

    signIn = input => {
        this.setState({ loading: true });
        const { username, password } = input;
        const { changeState } = this.props;

        Auth.signIn(username.toLowerCase(), password)
            .then(user => {
                this.setState({ loading: false });
                debug("User %O", user);
                if (
                    user.challengeName === "SMS_MFA" ||
                    user.challengeName === "SOFTWARE_TOKEN_MFA"
                ) {
                    debug("confirm user with %s", user.challengeName);
                    changeState("confirmSignIn", user);
                } else if (user.challengeName === "NEW_PASSWORD_REQUIRED") {
                    debug("require new password %s", user.challengeParam);
                    changeState("requireNewPassword", user);
                } else if (user.challengeName === "MFA_SETUP") {
                    debug("TOTP setup %s", user.challengeParam);
                    changeState("TOTPSetup", user);
                } else {
                    this.checkContact(user);
                }
            })
            .catch(err => {
                this.setState({ loading: false });
                if (err.code === "UserNotConfirmedException") {
                    debug("the user is not confirmed");
                    changeState("confirmSignUp", { username });
                } else if (err.code === "PasswordResetRequiredException") {
                    debug("password reset required", err);
                    changeState("forgotPassword", { username, system: true });
                } else {
                    this.setState({ error: err });
                }
            });
    };

    render() {
        const { children, ...authProps } = this.props;
        const { authState, changeState } = authProps;

        if (!this.authStates.includes(authState)) {
            return null;
        }

        return React.cloneElement(children, {
            authProps,
            signIn: this.signIn,
            changeState,
            error: this.state.error,
            loading: this.state.loading
        } as SignInChildrenProps);
    }
}

export default SignIn;
