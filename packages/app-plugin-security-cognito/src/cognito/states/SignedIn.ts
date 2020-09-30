import React from "react";
import { AuthProps, AuthState } from "../Authenticator";

export type SignedInProps = Omit<AuthProps, "checkingUser"> & {
    children: React.ReactNode;
};

class SignedIn extends React.Component<SignedInProps> {
    // States when this view should be visible
    authStates: AuthState[] = ["signedIn"];

    render() {
        const { children, ...authProps } = this.props;
        const { authState } = authProps;

        if (!this.authStates.includes(authState)) {
            return null;
        }

        return children;
    }
}

export default SignedIn;
