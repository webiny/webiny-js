import React, { useCallback, useEffect, useState } from "react";
import { Auth } from "@aws-amplify/auth";
import { AuthOptions } from "@aws-amplify/auth/lib-esm/types";
import ApolloClient from "apollo-client";
import { useApolloClient } from "@apollo/react-hooks";
import { setContext } from "apollo-link-context";
import { plugins } from "@webiny/plugins";
import { ApolloLinkPlugin } from "@webiny/app/plugins/ApolloLinkPlugin";
import { SecurityPermission } from "@webiny/app-security/types";
import { CognitoIdToken } from "@webiny/app-cognito-authenticator/types";
import { Authenticator } from "@webiny/app-cognito-authenticator/Authenticator";
import { useSecurity } from "@webiny/app-security";
import { config as appConfig } from "@webiny/app/config";
import { SignIn } from "~/views/SignIn";
import { RequireNewPassword } from "~/views/RequireNewPassword";
import { ForgotPassword } from "~/views/ForgotPassword";
import { SetNewPassword } from "~/views/SetNewPassword";
import { SignedIn } from "~/views/SignedIn";
import { LoggingIn } from "~/views/LoggingIn";
import { FederatedIdentityProvider } from "~/federatedIdentityProviders";
import { FederatedProviders } from "~/components/FederatedProviders";
import { View } from "~/components/View";

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
        const { setIdentity } = useSecurity();
        const client = useApolloClient();

        const onToken = useCallback(async (token: CognitoIdToken) => {
            const { payload, logout } = token;

            setLoadingIdentity(true);

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
