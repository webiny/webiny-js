import React, { useReducer, useEffect } from "react";
import Auth from "@aws-amplify/auth";
import { ApolloClient } from "@apollo/client";
import { withApollo, WithApolloClient } from "@apollo/client/react/hoc";
import { AlertType } from "@webiny/ui/Alert";
import { useSecurity } from "@webiny/app-security";
import { SecurityIdentity } from "@webiny/app-security/SecurityIdentity";

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
    getIdentityData(params: {
        client: ApolloClient<any>;
        payload: { [key: string]: any };
    }): Promise<{ [key: string]: any }>;
    children: AuthenticatorChildrenFunction;
}>;

const AuthenticatorComponent: React.FC<AuthenticatorProps> = props => {
    const { setIdentity } = useSecurity();

    const [state, setState] = useReducer((prev, next) => ({ ...prev, ...next }), {
        authState: "signIn",
        authData: null,
        message: null,
        checkingUser: false
    });

    const checkUrl = async () => {
        const query = new URLSearchParams(window.location.search);
        const queryData: any = {};
        query.forEach((value, key) => (queryData[key] = value));
        const { state, ...params } = queryData;

        if (state) {
            await onChangeState(state, params);
            return;
        }
        return checkUser();
    };

    useEffect(() => {
        checkUrl();
    }, []);

    const checkUser = async () => {
        setState({ checkingUser: true });
        try {
            const cognitoUser = await Auth.currentSession();
            if (!cognitoUser) {
                await onChangeState("signIn");
                setState({ checkingUser: false });
            } else {
                await onChangeState("signedIn");
                setState({ checkingUser: false });
            }
        } catch (e) {
            setState({ checkingUser: false });
        }
    };

    const onChangeState = async (state, data = null, message: AuthMessage = null) => {
        setState({ message });

        if (state === state.authState) {
            return;
        }

        // Cognito states call this state with user data.
        if (state === "signedIn") {
            setState({ checkingUser: true });
            const user = await Auth.currentSession();

            const { id, login, permissions, ...data } = await props.getIdentityData({
                client: props.client,
                payload: user.getIdToken().payload
            });

            setIdentity(
                new SecurityIdentity({
                    id,
                    login,
                    permissions,
                    ...data,
                    logout() {
                        Auth.signOut();
                        setIdentity(null);
                        setState({ authState: "signIn" });
                    }
                })
            );
            setState({ checkingUser: false });
        }

        setState({ authState: state, authData: data });
    };

    const { authState, authData, checkingUser, message } = state;

    return props.children({
        authState,
        authData,
        changeState: onChangeState,
        checkingUser,
        message
    });
};

export const Authenticator = withApollo<AuthenticatorProps>(AuthenticatorComponent);
