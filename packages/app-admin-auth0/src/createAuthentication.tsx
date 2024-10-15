import React, { useCallback, useEffect, useState } from "react";
import { setContext } from "apollo-link-context";
import ApolloClient from "apollo-client";
import { DocumentNode } from "graphql";
import { useApolloClient } from "@apollo/react-hooks";
import {
    useAuth0,
    Auth0Provider,
    Auth0ProviderOptions,
    LogoutOptions,
    Auth0ContextInterface,
    AppState,
    User
} from "@auth0/auth0-react";
import { plugins } from "@webiny/plugins";
import { ApolloLinkPlugin } from "@webiny/app/plugins/ApolloLinkPlugin";
import { useSecurity } from "@webiny/app-serverless-cms";
import { useTenancy, withTenant } from "@webiny/app-tenancy";
import { SecurityPermission } from "@webiny/app-security/types";
import { useRouter, UseHistory } from "@webiny/react-router";
import {
    createGetIdentityData,
    GetIdentityDataCallable,
    LOGIN_MT,
    LOGIN_ST
} from "./createGetIdentityData";
import { LoginContent, LoginLayout } from "~/components";

export type Auth0Options = Auth0ProviderOptions;

export type OnLogout = (logout: (options?: LogoutOptions) => Promise<void>) => void;

interface OnRedirectParams {
    history: UseHistory;
    appState?: AppState;
    user?: User;
}

export type OnRedirect = (params: OnRedirectParams) => void;
export type OnLogin = (auth0: Auth0ContextInterface) => void;

export interface CreateAuthenticationConfig {
    auth0: Auth0Options;
    getIdentityData?: GetIdentityDataCallable;
    loginMutation?: DocumentNode;
    onLogin?: OnLogin;
    onLogout?: OnLogout;
    onRedirect?: OnRedirect;
    onError?(error: Error): void;
    autoLogin?: boolean | (() => boolean);
}

export interface AuthenticationProps {
    getIdentityData(params: { client: ApolloClient<any> }): Promise<{ [key: string]: any }>;
    children: React.ReactNode;
}

interface WithGetIdentityDataProps {
    getIdentityData: GetIdentityDataCallable;
    children: React.ReactNode;
}

interface PropsWithChildren {
    children?: React.ReactNode;
}

const validatePermissions = (permissions: SecurityPermission[]) => {
    const appPermissions = permissions.filter(p => p.name !== "aacl");
    if (appPermissions.length === 0) {
        throw new Error("You have no permissions on this tenant!");
    }
};

const defaultLogout: OnLogout = logout => logout();

const defaultRedirect: OnRedirect = ({ appState, history }) => {
    if (appState?.returnTo) {
        history.push(appState.returnTo);
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
    onRedirect = defaultRedirect,
    ...config
}: CreateAuthenticationConfig) => {
    const withGetIdentityData = (
        Component: React.ComponentType<WithGetIdentityDataProps>
    ): React.ComponentType<PropsWithChildren> => {
        return function WithGetIdentityData({ children }) {
            const { isMultiTenant } = useTenancy();
            const loginMutation = config.loginMutation || (isMultiTenant ? LOGIN_MT : LOGIN_ST);
            const getIdentityData = config.getIdentityData || createGetIdentityData(loginMutation);

            return <Component getIdentityData={getIdentityData}>{children}</Component>;
        };
    };

    const Authentication = ({ getIdentityData, children }: AuthenticationProps) => {
        const auth0Context = useAuth0();
        const [loggingIn, setLoggingIn] = useState(false);
        const {
            isAuthenticated,
            isLoading: auth0Loading,
            getIdTokenClaims,
            getAccessTokenSilently,
            logout
        } = auth0Context;

        const isLoading = auth0Loading || loggingIn;

        const apolloClient = useApolloClient();
        const { setIdentity, identity, setIdTokenProvider } = useSecurity();

        const getIdToken = useCallback(async () => {
            const claims = await getIdTokenClaims();

            return {
                idToken: claims ? claims["__raw"] : undefined,
                claims
            };
        }, []);

        useEffect(() => {
            /**
             * We need to give the security layer a way to fetch the `idToken`, so other network clients can use
             * it when sending requests to external services (APIs, websockets,...).
             */
            setIdTokenProvider(async () => {
                const claims = await getIdTokenClaims();
                return claims ? claims["__raw"] : undefined;
            });

            plugins.register(
                new ApolloLinkPlugin(() => {
                    return setContext(async (_, { headers }) => {
                        // If "Authorization" header is already set, don't overwrite it.
                        if (headers && headers.Authorization) {
                            return { headers };
                        }

                        const { idToken } = await getIdToken();

                        if (!idToken) {
                            return { headers };
                        }

                        return {
                            headers: {
                                ...headers,
                                Authorization: `Bearer ${idToken}`
                            }
                        };
                    });
                })
            );
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
                setIdentity(null);
                onLogout(logout);
                return;
            }

            try {
                const { id, displayName, type, permissions, ...other } = await getIdentityData({
                    client: apolloClient
                });

                setIdentity({
                    id,
                    displayName,
                    type,
                    permissions,
                    ...other,
                    logout() {
                        setIdentity(null);
                        onLogout(logout);
                    }
                });

                validatePermissions(permissions);
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

        if (identity) {
            return <>{children}</>;
        }

        return (
            <LoginLayout>
                <LoginContent onLogin={login} isLoading={isLoading} />
            </LoginLayout>
        );
    };

    // Compose Login widget with GQL queries and multi-tenancy features.
    const LoginWidget = withGetIdentityData(withTenant(Authentication));

    return function Authentication({ children }: PropsWithChildren) {
        const { history } = useRouter();

        return (
            <Auth0Provider
                useRefreshTokens={true}
                cacheLocation="memory"
                onRedirectCallback={(appState, user) => {
                    onRedirect({ appState, user, history });
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
