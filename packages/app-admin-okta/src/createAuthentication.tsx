import React, { useCallback, useState, useEffect, useRef } from "react";
import { setContext } from "apollo-link-context";
import { DocumentNode } from "graphql";
import { useApolloClient } from "@apollo/react-hooks";
import { Security } from "@okta/okta-react";
import { OktaAuth, AuthStateManager } from "@okta/okta-auth-js";
import OktaSignIn from "@okta/okta-signin-widget";
import { plugins } from "@webiny/plugins";
import { CircularProgress } from "@webiny/ui/Progress";
import { SecurityIdentity, useSecurity } from "@webiny/app-security";
import { ApolloLinkPlugin } from "@webiny/app/plugins/ApolloLinkPlugin";

import OktaSignInWidget from "./OktaSignInWidget";
import { createGetIdentityData } from "./createGetIdentityData";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

export interface Config {
    getIdentityData?: any;
    loginMutation?: DocumentNode;
    oktaAuth: OktaAuth;
    oktaSignIn: OktaSignIn;
}

export interface Props {
    children: React.ReactNode;
}

export const createAuthentication = ({
    getIdentityData,
    loginMutation,
    oktaAuth,
    oktaSignIn
}: Config) => {
    if (!getIdentityData) {
        getIdentityData = createGetIdentityData(loginMutation);
    }

    const Authentication = ({ children }: Props) => {
        const timerRef = useRef(null);
        const apolloClient = useApolloClient();
        const { identity, setIdentity } = useSecurity();
        const [isAuthenticated, setIsAuthenticated] = useState(false);

        useEffect(() => {
            plugins.register(
                new ApolloLinkPlugin(() => {
                    return setContext(async (_, payload) => {
                        clearTimeout(timerRef.current);

                        timerRef.current = setTimeout(() => {
                            // Reload browser after 1 hour of inactivity
                            window.location.reload();
                        }, 3600000);

                        return payload;
                    });
                }),
                new ApolloLinkPlugin(() => {
                    return setContext(async (_, { headers }) => {
                        // If "Authorization" header is already set, don't overwrite it.
                        if (headers && headers.Authorization) {
                            return { headers };
                        }

                        if (!oktaAuth.isAuthenticated()) {
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

        const authStateChanged = useCallback(async authState => {
            setIsAuthenticated(authState.isAuthenticated);
            if (authState.isAuthenticated) {
                try {
                    const data = await getIdentityData({ client: apolloClient });

                    setIdentity(
                        new SecurityIdentity({
                            ...data,
                            logout() {
                                clearTimeout(timerRef.current);
                                oktaAuth.signOut();
                                setIdentity(null);
                                setIsAuthenticated(false);
                            }
                        })
                    );
                } catch (err) {
                    console.log(err);
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
                {identity ? (
                    children
                ) : isAuthenticated ? (
                    <CircularProgress label={"Checking user..."} />
                ) : (
                    <OktaSignInWidget oktaSignIn={oktaSignIn} />
                )}
            </Security>
        );
    };

    return Authentication;
};
