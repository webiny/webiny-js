import React, { useReducer, useEffect } from "react";
import Auth from "@aws-amplify/auth";
import { withApollo, WithApolloClient } from "react-apollo";
import { AlertType } from "@webiny/ui/Alert";
import { useSecurity } from "@webiny/app-security";
import { LOGIN } from "./graphql";
import minimatch from "minimatch";

export const hasPermission = (requiredPermission, permissionsList) => {
    if (!Array.isArray(permissionsList)) {
        return false;
    }

    for (let i = 0; i < permissionsList.length; i++) {
        const permissionsListScope = permissionsList[i];
        if (minimatch(requiredPermission, permissionsListScope)) {
            return true;
        }
    }

    return false;
};

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
    children: AuthenticatorChildrenFunction;
}>;

const AuthenticatorClass: React.FC<AuthenticatorProps> = (props) => {
    const security = useSecurity();

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
            const user = await Auth.currentSession();
            const { data } = await props.client.mutate({
                mutation: LOGIN,
                context: {
                    headers: {
                        Authorization: `Bearer ${user.getIdToken().getJwtToken()}`
                    }
                }
            });
            security.setIdentity({
                ...data.login,
                logout() {
                    Auth.signOut();
                },
                hasPermission(permission) {
                    const permissions = Array.isArray(permission) ? permission : [permission];
                    return !permissions
                        .map((v) => hasPermission(v, this.permissions))
                        .some((v) => v === false);
                }
            });
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

export const Authenticator = withApollo<AuthenticatorProps>(AuthenticatorClass);
