import React from "react";
import Auth from "@aws-amplify/auth";
import { AuthProps } from "../Authenticator";

export type SetNewPasswordChildrenProps = {
    authProps: AuthProps;
    setPassword(params: { code: string; password: string }): Promise<void>;
    error: Error;
    loading: boolean;
};

export type SetNewPasswordProps = Omit<AuthProps, "checkingUser"> & {
    children: React.ReactElement;
};

class SetNewPassword extends React.Component<SetNewPasswordProps> {
    authStates = ["setNewPassword"];

    state = {
        error: null,
        loading: false
    };

    setPassword = async data => {
        this.setState({ loading: true });
        const { code, password } = data;
        const { authData } = this.props;

        try {
            await Auth.forgotPasswordSubmit(authData.toLowerCase(), code, password);
            this.props.changeState("signIn", null, {
                title: "Password updated",
                text: "You can now login using your new password!",
                type: "success"
            });
            this.setState({ loading: false, error: null });
        } catch (err) {
            this.setState({ loading: false, error: err.message });
        }
    };

    render() {
        const { children, ...authProps } = this.props;
        const { authState } = authProps;

        if (!this.authStates.includes(authState)) {
            return null;
        }

        return React.cloneElement(children, {
            authProps,
            setPassword: this.setPassword,
            error: this.state.error,
            loading: this.state.loading
        } as SetNewPasswordChildrenProps);
    }
}

export default SetNewPassword;
