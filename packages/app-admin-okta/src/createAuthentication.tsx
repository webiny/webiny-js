import React, { useCallback, useState, useEffect } from "react";
import { Security, LoginCallback } from "@okta/okta-react";
import type { OktaAuth, AuthStateManager } from "@okta/okta-auth-js";
import type OktaSignIn from "@okta/okta-signin-widget";
import { CircularProgress } from "@webiny/ui/Progress/index.js";
import { useAuthentication } from "@webiny/app-admin";
import OktaSignInWidget from "./OktaSignInWidget.js";

const noop = () => {
    return void 0;
};

export interface Config {
    oktaAuth: OktaAuth;
    oktaSignIn: OktaSignIn;
    clientId: string;
    onError?: (error: Error) => void;
}

export interface AuthenticationProps {
    children: React.ReactNode;
}

interface AuthState {
    isAuthenticated?: boolean;
    idToken: {
        clientId?: string;
    };
}

export const createAuthentication = ({ oktaAuth, oktaSignIn, clientId, onError }: Config) => {
    const Authentication = ({ children }: AuthenticationProps) => {
        const authentication = useAuthentication();
        const [isAuthenticated, setIsAuthenticated] = useState(false);

        const logout = () => {
            oktaAuth.signOut();
            setIsAuthenticated(false);
        };

        const authStateChanged = useCallback(async (authState: AuthState) => {
            setIsAuthenticated(!!authState.isAuthenticated);
            if (!authState.isAuthenticated) {
                await authentication.logout();
                return;
            }

            // Make sure current app client ID matches token's clientId.
            // If not, verify that current identity can access current app, using the given app client id.
            if (authState.idToken.clientId !== clientId) {
                try {
                    await oktaAuth.token.renewTokens();
                } catch (err) {
                    if (err.message.includes("User is not assigned to the client application")) {
                        await authentication.logout();
                        setIsAuthenticated(false);
                        return;
                    }
                }
            }

            try {
                await authentication.login({
                    identityType: "OktaIdentity",
                    idTokenProvider: () => oktaAuth.getIdToken(),
                    logoutCallback: logout
                });
            } catch (err) {
                if (typeof onError === "function") {
                    onError(err);
                } else {
                    console.error(err);
                    logout();
                }
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
                {authentication.isAuthenticated ? (
                    children
                ) : isAuthenticated ? (
                    <CircularProgress label={"Logging in..."} />
                ) : (
                    <OktaSignInWidget oktaSignIn={oktaSignIn} />
                )}
            </Security>
        );
    };
    return Authentication;
};
