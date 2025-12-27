import React, { useCallback, useEffect, useState } from "react";
import { Auth } from "@aws-amplify/auth";
import type { AuthOptions } from "@aws-amplify/auth/lib-esm/types/index.js";
import type ApolloClient from "apollo-client";
import { useApolloClient } from "@apollo/react-hooks";
import { setContext } from "apollo-link-context";
import { plugins } from "@webiny/plugins";
import { ApolloLinkPlugin } from "@webiny/app/plugins/ApolloLinkPlugin.js";
import type { SecurityPermission } from "@webiny/app-security/types.js";
import type { CognitoIdToken } from "@webiny/app-cognito-authenticator/types.js";
import { Authenticator } from "@webiny/app-cognito-authenticator/Authenticator.js";
import { useSecurity } from "@webiny/app-security";
import { config as appConfig } from "@webiny/app/config.js";
import { SignIn } from "~/views/SignIn.js";
import { RequireNewPassword } from "~/views/RequireNewPassword.js";
import { ForgotPassword } from "~/views/ForgotPassword.js";
import { SetNewPassword } from "~/views/SetNewPassword.js";
import { SignedIn } from "~/views/SignedIn.js";
import { LoggingIn } from "~/views/LoggingIn.js";
import type { FederatedIdentityProvider } from "~/federatedIdentityProviders.js";
import { FederatedProviders } from "~/components/FederatedProviders.js";
import { View } from "~/components/View.js";
import { useAuthenticationContext } from "@webiny/app-admin/presentation/security/useAuthenticationContext.js";

export const Components = {
    View,
    FederatedProviders,
    SignIn
};

const createApolloLinkPlugin = (): ApolloLinkPlugin => {
    return new ApolloLinkPlugin(() => {
        return setContext(async (_, { headers }) => {
            const user = await Auth.currentSession();
            const idToken = user.getIdToken();

            if (!idToken) {
                return { headers };
            }

            // If "Authorization" header is already set, don't overwrite it.
            if (headers && headers.Authorization) {
                return { headers };
            }

            return {
                headers: {
                    ...headers,
                    Authorization: `Bearer ${idToken.getJwtToken()}`
                }
            };
        });
    });
};

const validatePermissions = (permissions: SecurityPermission[]) => {
    const appPermissions = permissions.filter(p => p.name !== "aacl");
    if (appPermissions.length === 0) {
        throw new Error("You have no permissions on this tenant!");
    }
};

const defaultOptions = {
    region: appConfig.getKey("USER_POOL_REGION", process.env.REACT_APP_USER_POOL_REGION),
    userPoolId: appConfig.getKey("USER_POOL_ID", process.env.REACT_APP_USER_POOL_ID),
    userPoolWebClientId: appConfig.getKey(
        "USER_POOL_WEB_CLIENT_ID",
        process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID
    )
};

export interface AuthenticationProps {
    children: React.ReactNode;
}

export interface AuthenticationFactoryConfig extends AuthOptions {
    allowSignInWithCredentials?: boolean;
    federatedProviders?: FederatedIdentityProvider[];
    onError?: (error: Error) => void;
    getIdentityData: (params: {
        client: ApolloClient<any>;
        payload: { [key: string]: any };
    }) => Promise<{ [key: string]: any }>;
}

interface AuthenticationFactory {
    (params: AuthenticationFactoryConfig): React.ComponentType<AuthenticationProps>;
}

export const createAuthentication: AuthenticationFactory = ({
    allowSignInWithCredentials = true,
    getIdentityData,
    onError,
    ...config
}) => {
    /**
     * TODO @ts-refactor
     */
    // @ts-expect-error
    Object.keys(config).forEach(key => config[key] === undefined && delete config[key]);
    Auth.configure({ ...defaultOptions, ...config });

    const Authentication = (props: AuthenticationProps) => {
        const { children } = props;
        const [loadingIdentity, setLoadingIdentity] = useState(false);
        const { setIdentity, setIdTokenProvider } = useSecurity();
        const authContext = useAuthenticationContext();
        const client = useApolloClient();

        const onToken = useCallback(async (token: CognitoIdToken) => {
            const { payload, logout } = token;

            setLoadingIdentity(true);

            authContext.setLogoutCallback(logout);

            try {
                const { id, displayName, type, permissions, ...data } = await getIdentityData({
                    client,
                    payload
                });

                setIdentity({
                    id,
                    displayName,
                    type,
                    permissions,
                    ...data,
                    logout:
                        logout ||
                        (() => {
                            return void 0;
                        })
                });

                validatePermissions(permissions);
            } catch (err) {
                console.log("ERROR", err);
                if (typeof onError === "function") {
                    onError(err);
                } else {
                    console.error(err);
                }
            } finally {
                setLoadingIdentity(false);
            }
        }, []);

        useEffect(() => {
            /**
             * We need to give the security layer a way to fetch the `idToken`, so other network clients can use
             * it when sending requests to external services (APIs, websockets,...).
             */
            setIdTokenProvider(async () => {
                const user = await Auth.currentSession();
                const idToken = user.getIdToken();

                return idToken ? idToken.getJwtToken() : undefined;
            });

            authContext.setIdTokenProvider(async () => {
                const user = await Auth.currentSession();
                const idToken = user.getIdToken();

                return idToken ? idToken.getJwtToken() : undefined;
            });

            plugins.register(createApolloLinkPlugin());
        }, []);

        return (
            <Authenticator onToken={onToken}>
                {loadingIdentity ? (
                    <LoggingIn />
                ) : (
                    <SignIn
                        federatedProviders={config.federatedProviders}
                        allowSignInWithCredentials={allowSignInWithCredentials}
                    />
                )}
                <RequireNewPassword />
                <ForgotPassword />
                <SetNewPassword />
                <SignedIn>{children}</SignedIn>
            </Authenticator>
        );
    };

    return Authentication;
};
