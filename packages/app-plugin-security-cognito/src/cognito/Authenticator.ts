import React from "react";
import Auth from "@aws-amplify/auth";
import { withApollo, WithApolloClient } from "react-apollo";
import localStorage from "store";
import observe from "store/plugins/observe";
import debug from "./debug";
import { AlertType } from "@webiny/ui/Alert";
localStorage.addPlugin(observe);

export type AuthState =
    | "signIn"
    | "signedIn"
    | "signedOut"
    | "signedUp"
    | "verifyContact"
    | "confirmSignIn"
    | "requireNewPassword"
    | "setNewPassword"
    | "TOTPSetup"
    | "confirmSignUp"
    | "forgotPassword";

export type AuthData = { [key: string]: any };

export type AuthMessage = { title: string; text: string; type: AlertType };

export type AuthChangeState = (
    state: AuthState,
    data?: AuthData,
    message?: AuthMessage
) => Promise<void>;

export type AuthProps = {
    authState: AuthState;
    authData: AuthData;
    changeState: AuthChangeState;
    checkingUser?: boolean;
    message: AuthMessage;
};

export type AuthenticatorChildrenFunction = (params: AuthProps) => React.ReactElement;

export type AuthenticatorProps = WithApolloClient<{
    onIdToken(idToken: string): void;
    children: AuthenticatorChildrenFunction;
}>;

type AuthenticatorState = {
    authState: AuthState;
    authData: AuthData;
    checkingUser?: boolean;
    message?: AuthMessage;
};

class AuthenticatorClass extends React.Component<AuthenticatorProps, AuthenticatorState> {
    state: AuthenticatorState = {
        authState: "signIn",
        authData: null
    };

    async componentDidMount() {
        const query = new URLSearchParams(window.location.search);
        const queryData: any = {};
        query.forEach((value, key) => (queryData[key] = value));
        const { state, ...params } = queryData;

        if (state) {
            await this.onChangeState(state, params);
            return;
        }
        return this.checkUser();
    }

    checkUser = async () => {
        this.setState({ checkingUser: true });
        try {
            const cognitoUser = await Auth.currentSession();
            if (!cognitoUser) {
                await this.onChangeState("signIn");
                this.setState({ checkingUser: false });
            }
        } catch (e) {
            debug("Error %s", e);
            this.setState({ checkingUser: false });
        }
    };

    onChangeState = async (state, data = null, message: AuthMessage = null) => {
        this.setState({ message });

        debug("Requested state change %s %O", state, data);
        if (state === this.state.authState) {
            return;
        }

        // Cognito states call this state with user data.
        if (state === "signedIn" && data) {
            const user = await Auth.currentSession();
            return this.props.onIdToken(user.getIdToken().getJwtToken());
        }

        if (state === "signedOut") {
            state = "signIn";
        }

        this.setState({ authState: state, authData: data });
    };

    render() {
        const { authState, authData, checkingUser, message } = this.state;

        return this.props.children({
            authState,
            authData,
            changeState: this.onChangeState,
            checkingUser,
            message
        });
    }
}

export const Authenticator = withApollo<AuthenticatorProps>(AuthenticatorClass);
