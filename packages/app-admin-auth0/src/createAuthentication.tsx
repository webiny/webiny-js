import React, { useCallback, useEffect } from "react";
import { setContext } from "apollo-link-context";
import ApolloClient from "apollo-client";
import { DocumentNode } from "graphql";
import { useApolloClient } from "@apollo/react-hooks";
import { useAuth0, Auth0Provider, Auth0ProviderOptions, LogoutOptions } from "@auth0/auth0-react";
import { plugins } from "@webiny/plugins";
import { ApolloLinkPlugin } from "@webiny/app/plugins/ApolloLinkPlugin";
import { useSecurity } from "@webiny/app-serverless-cms";
import { useTenancy, withTenant } from "@webiny/app-tenancy";
import { SecurityPermission } from "@webiny/app-security/types";
import {
    createGetIdentityData,
    GetIdentityDataCallable,
    LOGIN_MT,
    LOGIN_ST
} from "./createGetIdentityData";
import { LoginContent, LoginLayout } from "~/components";

export type Auth0Options = Auth0ProviderOptions;

export type OnLogout = (logout: (options?: LogoutOptions) => Promise<void>) => void;

export interface CreateAuthenticationConfig {
    getIdentityData?: GetIdentityDataCallable;
    loginMutation?: DocumentNode;
    onLogout?: OnLogout;
    onError?(error: Error): void;
    auth0: Auth0Options;
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

export const createAuthentication = ({
    auth0,
    onError,
    onLogout = defaultLogout,
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
        const { isAuthenticated, isLoading, getIdTokenClaims, getAccessTokenSilently, logout } =
            useAuth0();

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
                await getAccessTokenSilently();
            } catch {
                // Ignore error; it simply means the user is not logged in.
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
                console.log("ERROR", err);
                if (typeof onError === "function") {
                    onError(err);
                } else {
                    console.error(err);
                    onLogout(logout);
                }
            }
        };

        useEffect(() => {
            // Call Webiny to fetch the identity information.
            if (isAuthenticated) {
                getIdentity();

                return;
            }

            // Try to restore user's session.
            if (!isAuthenticated && !isLoading) {
                loginSilently();
            }
        }, [isAuthenticated, isLoading]);

        if (identity) {
            return <>{children}</>;
        }

        return (
            <LoginLayout>
                <LoginContent />
            </LoginLayout>
        );
    };

    // Compose Login widget with GQL queries and multi-tenancy features.
    const LoginWidget = withGetIdentityData(withTenant(Authentication));

    return function Authentication({ children }: PropsWithChildren) {
        return (
            <Auth0Provider
                useRefreshTokens={true}
                cacheLocation="memory"
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
