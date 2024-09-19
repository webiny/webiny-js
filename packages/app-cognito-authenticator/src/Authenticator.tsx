import React, { useEffect, useMemo, useReducer } from "react";
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

export interface AuthDataVerified {
    email?: string;
    phone_number?: string;
}

export interface AuthDataUnverified {
    email?: string;
    phone_number?: string;
}

export interface AuthData {
    username?: string;
    verified?: AuthDataVerified;
    unverified?: AuthDataUnverified;
    [key: string]: string | null | boolean | undefined | AuthDataVerified | AuthDataUnverified;
}

export interface AuthMessage {
    title: string;
    text: string;
    type: "success" | "info" | "warning" | "danger";
}

export interface AuthChangeState {
    (state: AuthState, data?: AuthData | null, message?: AuthMessage | null): Promise<void>;
}

export interface AuthContextValue {
    authState: AuthState;
    authData: AuthData | null;
    changeState: AuthChangeState;
    checkingUser?: boolean;
    message: AuthMessage | null;
}

export interface AuthenticatorProps extends AuthOptions {
    onToken: (token: CognitoIdToken) => void;
    children: React.ReactNode;
}

export const AuthenticatorContext = React.createContext<AuthContextValue>({} as AuthContextValue);

interface State {
    authState: AuthState;
    authData: AuthData | null;
    message: AuthMessage | null;
    checkingUser: boolean;
}
interface Reducer {
    (prev: State, next: Partial<State>): State;
}

interface QueryData {
    state?: AuthState;
    [key: string]: string | undefined;
}

export const Authenticator = ({ onToken, children }: AuthenticatorProps) => {
    const [state, setState] = useReducer<Reducer>((prev, next) => ({ ...prev, ...next }), {
        authState: "signIn",
        authData: null,
        message: null,
        checkingUser: false
    });

    const checkUrl = async () => {
        const query = new URLSearchParams(window.location.search);
        const queryData: QueryData = {};
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
        } catch {
            setState({ checkingUser: false });
        }
    };

    const onChangeState = async (
        authState: State["authState"],
        data: AuthData | null = null,
        message: AuthMessage | null = null
    ) => {
        setState({
            message: message || null
        });

        if (authState === state.authState) {
            return;
        }

        // Cognito states call this state with user data.
        if (authState === "signedIn") {
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

        setState({
            authState,
            authData: data || null
        });
    };

    const value = useMemo(() => {
        return { ...state, changeState: onChangeState };
    }, [state]);

    return <AuthenticatorContext.Provider value={value}>{children}</AuthenticatorContext.Provider>;
};
