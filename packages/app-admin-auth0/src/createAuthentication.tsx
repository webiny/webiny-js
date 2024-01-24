import React, { useCallback, useEffect } from "react";
import { setContext } from "apollo-link-context";
import ApolloClient from "apollo-client";
import { DocumentNode } from "graphql";
import { useApolloClient } from "@apollo/react-hooks";
import { plugins } from "@webiny/plugins";
import { ApolloLinkPlugin } from "@webiny/app/plugins/ApolloLinkPlugin";
import { useSecurity } from "@webiny/app-serverless-cms";
import { useTenancy, withTenant } from "@webiny/app-tenancy";
import { useAuth0, Auth0Provider, Auth0ProviderOptions } from "@auth0/auth0-react";
import {
    createGetIdentityData,
    GetIdentityDataCallable,
    LOGIN_MT,
    LOGIN_ST
} from "./createGetIdentityData";
import { LoginLayout } from "./components/LoginLayout";
import { LoginContent } from "~/components/LoginContent";

export type Auth0Options = Auth0ProviderOptions;

export interface CreateAuthenticationConfig {
    getIdentityData?: GetIdentityDataCallable;
    loginMutation?: DocumentNode;
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

export const createAuthentication = ({ auth0, ...config }: CreateAuthenticationConfig) => {
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
        const { setIdentity, identity } = useSecurity();

        const getIdToken = useCallback(async () => {
            const claims = await getIdTokenClaims();

            return {
                idToken: claims ? claims["__raw"] : undefined,
                claims
            };
        }, []);

        useEffect(() => {
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
                logout();
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
                        logout();
                    }
                });
            } catch (err) {
                console.log(err);
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
                redirectUri={window.location.origin}
                useRefreshTokens={true}
                cacheLocation="memory"
                {...auth0}
            >
                <LoginWidget>{children}</LoginWidget>
            </Auth0Provider>
        );
    };
};
