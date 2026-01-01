import React, { useCallback, useEffect, useState } from "react";
import type {
    Auth0ProviderOptions,
    LogoutOptions,
    Auth0ContextInterface,
    AppState,
    User
} from "@auth0/auth0-react";
import { useAuth0, Auth0Provider } from "@auth0/auth0-react";
import { useAuthentication } from "@webiny/app-admin";
import { LoginContent } from "./components/index.js";

export type Auth0Options = Auth0ProviderOptions;

export type OnLogout = (logout: (options?: LogoutOptions) => Promise<void>) => void;

interface OnRedirectParams {
    appState?: AppState;
    user?: User;
}

export type OnRedirect = (params: OnRedirectParams) => void;
export type OnLogin = (auth0: Auth0ContextInterface) => void;

export interface CreateAuthenticationConfig {
    auth0: Auth0Options;
    onLogin?: OnLogin;
    onLogout?: OnLogout;
    onRedirect?: OnRedirect;
    onError?(error: Error): void;
    autoLogin?: boolean | (() => boolean);
}

export interface AuthenticationProps {
    children: React.ReactNode;
}

interface PropsWithChildren {
    children?: React.ReactNode;
}

const defaultLogout: OnLogout = logout => logout();

const defaultRedirect: OnRedirect = ({ appState }) => {
    if (appState?.returnTo) {
        window.history.pushState(undefined, "", appState.returnTo);
    }
};

const defaultLogin: OnLogin = auth0 => {
    auth0.loginWithRedirect({
        appState: { returnTo: window.location.pathname + window.location.search }
    });
};

export const createAuthentication = ({
    auth0,
    onError,
    autoLogin = false,
    onLogin = defaultLogin,
    onLogout = defaultLogout,
    onRedirect = defaultRedirect
}: CreateAuthenticationConfig) => {
    const Authentication = ({ children }: AuthenticationProps) => {
        const auth0Context = useAuth0();
        const [loggingIn, setLoggingIn] = useState(false);
        const {
            isAuthenticated,
            isLoading: auth0Loading,
            getIdTokenClaims,
            getAccessTokenSilently,
            logout
        } = auth0Context;

        const authentication = useAuthentication();

        const isLoading = auth0Loading || loggingIn;

        const getIdToken = useCallback(async () => {
            const claims = await getIdTokenClaims();

            return {
                idToken: claims ? claims["__raw"] : undefined,
                claims
            };
        }, []);

        const loginSilently = async () => {
            try {
                setLoggingIn(true);
                await getAccessTokenSilently();
            } finally {
                setLoggingIn(false);
            }
        };

        const getIdentity = async () => {
            const { claims } = await getIdToken();

            // Make sure current app client ID matches token's clientId, if not, log the user out.
            if (claims?.aud !== auth0.clientId) {
                onLogout(logout);
                return;
            }

            try {
                await authentication.login({
                    idTokenProvider: async () => {
                        const claims = await getIdTokenClaims();
                        return claims ? claims["__raw"] : undefined;
                    },
                    logoutCallback: () => {
                        onLogout(logout);
                    }
                });

                // Remove the "action" query param.
                const url = new URL(window.location);
                url.searchParams.delete("action");
                window.history.replaceState({}, "", url);
            } catch (err) {
                if (typeof onError === "function") {
                    onError(err);
                } else {
                    console.error(err);
                    onLogout(logout);
                }
            }
        };

        const login = () => {
            setLoggingIn(true);
            onLogin(auth0Context);
        };

        const restoreSessionOrLogin = async () => {
            await loginSilently();
        };

        const shouldLogin = () => {
            if (typeof autoLogin === "function") {
                return autoLogin();
            }

            return autoLogin;
        };

        useEffect(() => {
            // Call Webiny to fetch the identity information.
            if (isAuthenticated) {
                getIdentity();

                return;
            }

            if (!isAuthenticated && !isLoading) {
                if (auth0.cacheLocation === "localstorage") {
                    restoreSessionOrLogin();
                } else if (shouldLogin()) {
                    login();
                }
            }
        }, [isAuthenticated, isLoading]);

        if (authentication.isAuthenticated) {
            return <>{children}</>;
        }

        return <LoginContent onLogin={login} isLoading={isLoading} />;
    };

    const LoginWidget = Authentication;

    return function Authentication({ children }: PropsWithChildren) {
        return (
            <Auth0Provider
                useRefreshTokens={true}
                cacheLocation="localstorage"
                onRedirectCallback={(appState, user) => {
                    onRedirect({ appState, user });
                }}
                {...auth0}
                authorizationParams={{
                    redirect_uri: window.location.origin,
                    ...auth0.authorizationParams
                }}
            >
                <LoginWidget>{children}</LoginWidget>
            </Auth0Provider>
        );
    };
};
