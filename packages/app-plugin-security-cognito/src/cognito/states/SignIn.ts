import React from "react";
import Auth from "@aws-amplify/auth";
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

    checkContact = (user) => {
        const { changeState } = this.props;

        Auth.verifiedContact(user).then((data) => {
            if (data.verified) {
                changeState("signedIn", user);
            } else {
                changeState("verifyContact", { ...user, ...data });
            }
        });
    };

    signIn = (input) => {
        this.setState({ loading: true, error: null });
        const { username, password } = input;
        const { changeState } = this.props;

        Auth.signIn(username.toLowerCase(), password)
            .then((user) => {
                this.setState({ loading: false });
                if (
                    user.challengeName === "SMS_MFA" ||
                    user.challengeName === "SOFTWARE_TOKEN_MFA"
                ) {
                    changeState("confirmSignIn", user);
                } else if (user.challengeName === "NEW_PASSWORD_REQUIRED") {
                    changeState("requireNewPassword", user);
                } else if (user.challengeName === "MFA_SETUP") {
                    changeState("TOTPSetup", user);
                } else {
                    this.checkContact(user);
                }
            })
            .catch((err) => {
                this.setState({ loading: false });
                if (err.code === "UserNotConfirmedException") {
                    changeState("confirmSignUp", { username });
                } else if (err.code === "PasswordResetRequiredException") {
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
