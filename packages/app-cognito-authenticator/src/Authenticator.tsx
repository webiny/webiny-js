import React, { useReducer, useEffect, useMemo } from "react";
import { Auth } from "@aws-amplify/auth";
import { AuthOptions } from "@aws-amplify/auth/lib-esm/types";
import { CognitoIdToken } from "./types";

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

export interface AuthData {
    [key: string]: any;
}

export interface AuthMessage {
    title: string;
    text: string;
    type: "success" | "info" | "warning" | "danger";
}

export interface AuthChangeState {
    (state: AuthState, data?: AuthData, message?: AuthMessage): Promise<void>;
}

export interface AuthContextValue {
    authState: AuthState;
    authData: AuthData;
    changeState: AuthChangeState;
    checkingUser?: boolean;
    message: AuthMessage;
}

export interface AuthenticatorProps extends AuthOptions {
    onToken: (token: CognitoIdToken) => void;
    children: React.ReactNode;
}

export const AuthenticatorContext = React.createContext<AuthContextValue>({} as any);

export const Authenticator = ({ onToken, children }: AuthenticatorProps) => {
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
            console.log("error", e);
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
            const user = await Auth.currentSession();
            const idToken = user.getIdToken();

            await onToken({
                idToken: idToken.getJwtToken(),
                payload: idToken.payload,
                logout() {
                    Auth.signOut();
                    setState({ authState: "signIn" });
                }
            });
        }

        setState({ authState: state, authData: data });
    };

    const value = useMemo(() => {
        return { ...state, changeState: onChangeState };
    }, [state]);

    return <AuthenticatorContext.Provider value={value}>{children}</AuthenticatorContext.Provider>;
};
