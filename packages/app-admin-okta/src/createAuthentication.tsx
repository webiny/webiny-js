import React, { useCallback, useState, useEffect, useRef } from "react";
import { setContext } from "apollo-link-context";
import ApolloClient from "apollo-client";
import { DocumentNode } from "graphql";
import { useApolloClient } from "@apollo/react-hooks";
import { Security, LoginCallback } from "@okta/okta-react";
import { OktaAuth, AuthStateManager } from "@okta/okta-auth-js";
import OktaSignIn from "@okta/okta-signin-widget";
import { plugins } from "@webiny/plugins";
import { CircularProgress } from "@webiny/ui/Progress";
import { useSecurity } from "@webiny/app-serverless-cms";
import { ApolloLinkPlugin } from "@webiny/app/plugins/ApolloLinkPlugin";
import { useTenancy, withTenant } from "@webiny/app-tenancy";
import OktaSignInWidget from "./OktaSignInWidget";
import {
    createGetIdentityData,
    GetIdentityDataCallable,
    LOGIN_MT,
    LOGIN_ST
} from "./createGetIdentityData";
import { SecurityPermission } from "@webiny/app-security/types";

const noop = () => {
    return void 0;
};

export interface Config {
    oktaAuth: OktaAuth;
    oktaSignIn: OktaSignIn;
    clientId: string;
    getIdentityData?: GetIdentityDataCallable;
    loginMutation?: DocumentNode;
    onError?: (error: Error) => void;
}

export interface AuthenticationProps {
    getIdentityData(params: { client: ApolloClient<any> }): Promise<{ [key: string]: any }>;
    children: React.ReactNode;
}

interface WithGetIdentityDataProps {
    getIdentityData: GetIdentityDataCallable;
    children: React.ReactNode;
}

interface AuthState {
    isAuthenticated?: boolean;
    idToken: {
        clientId?: string;
    };
}

interface WithGetIdentityDataFunctionProps {
    children?: React.ReactNode;
}

const validatePermissions = (permissions: SecurityPermission[]) => {
    const appPermissions = permissions.filter(p => p.name !== "aacl");
    if (appPermissions.length === 0) {
        throw new Error("You have no permissions on this tenant!");
    }
};

export const createAuthentication = ({
    oktaAuth,
    oktaSignIn,
    clientId,
    onError,
    ...config
}: Config) => {
    const withGetIdentityData = (Component: React.ComponentType<WithGetIdentityDataProps>) => {
        return function WithGetIdentityData({ children }: WithGetIdentityDataFunctionProps) {
            const { isMultiTenant } = useTenancy();
            const loginMutation = config.loginMutation || (isMultiTenant ? LOGIN_MT : LOGIN_ST);
            const getIdentityData = config.getIdentityData || createGetIdentityData(loginMutation);

            return <Component getIdentityData={getIdentityData}>{children}</Component>;
        };
    };

    const Authentication = ({ getIdentityData, children }: AuthenticationProps) => {
        const timerRef = useRef<number | undefined>(undefined);
        const apolloClient = useApolloClient();
        const { identity, setIdentity, setIdTokenProvider } = useSecurity();
        const [isAuthenticated, setIsAuthenticated] = useState(false);

        useEffect(() => {
            /**
             * We need to give the security layer a way to fetch the `idToken`, so other network clients can use
             * it when sending requests to external services (APIs, websockets,...).
             */
            setIdTokenProvider(() => {
                return oktaAuth.getIdToken();
            });

            plugins.register(
                new ApolloLinkPlugin(() => {
                    return setContext(async (_, payload) => {
                        clearTimeout(timerRef.current);

                        timerRef.current = setTimeout(() => {
                            // Reload browser after 1 hour of inactivity
                            window.location.reload();
                        }, 3600000) as unknown as number;

                        return payload;
                    });
                }),
                new ApolloLinkPlugin(() => {
                    return setContext(async (_, { headers }) => {
                        // If "Authorization" header is already set, don't overwrite it.
                        if (headers && headers.Authorization) {
                            return { headers };
                        }

                        if (!(await oktaAuth.isAuthenticated())) {
                            return { headers };
                        }

                        const idToken = oktaAuth.getIdToken();

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

        const logout = () => {
            clearTimeout(timerRef.current);
            oktaAuth.signOut();
            setIdentity(null);
            setIsAuthenticated(false);
        };

        const authStateChanged = useCallback(async (authState: AuthState) => {
            setIsAuthenticated(!!authState.isAuthenticated);
            if (authState.isAuthenticated) {
                // Make sure current app client ID matches token's clientId.
                // If not, verify that current identity can access current app, using the given app client id.
                if (authState.idToken.clientId !== clientId) {
                    try {
                        await oktaAuth.token.renewTokens();
                    } catch (err) {
                        if (
                            err.message.includes("User is not assigned to the client application")
                        ) {
                            setIdentity(null);
                            setIsAuthenticated(false);
                            return;
                        }
                    }
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
                        logout
                    });

                    validatePermissions(permissions);
                } catch (err) {
                    if (typeof onError === "function") {
                        onError(err);
                    } else {
                        console.error(err);
                        logout();
                    }
                }
            } else {
                // Unset identity
                setIdentity(null);
            }
        }, []);

        useEffect(() => {
            const authStateManager: AuthStateManager = oktaAuth.authStateManager;
            authStateManager.subscribe(authStateChanged);

            return () => authStateManager.unsubscribe(authStateChanged);
        }, []);

        return (
            <Security oktaAuth={oktaAuth} restoreOriginalUri={noop}>
                <LoginCallback />
                {identity ? (
                    children
                ) : isAuthenticated ? (
                    <CircularProgress label={"Logging in..."} />
                ) : (
                    <OktaSignInWidget oktaSignIn={oktaSignIn} />
                )}
            </Security>
        );
    };

    return withGetIdentityData(withTenant(Authentication));
};
