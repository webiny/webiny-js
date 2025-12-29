import React, { useCallback, useEffect, useState } from "react";
import { Auth } from "@aws-amplify/auth";
import type { AuthOptions } from "@aws-amplify/auth/lib-esm/types/index.js";
import { setContext } from "apollo-link-context";
import { plugins } from "@webiny/plugins";
import { ApolloLinkPlugin } from "@webiny/app/plugins/ApolloLinkPlugin.js";
import type { CognitoIdToken } from "@webiny/app-cognito-authenticator/types.js";
import { Authenticator } from "@webiny/app-cognito-authenticator/Authenticator.js";
import { useAuthentication } from "@webiny/app-admin";
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
}

interface AuthenticationFactory {
    (params: AuthenticationFactoryConfig): React.ComponentType<AuthenticationProps>;
}

export const createAuthentication: AuthenticationFactory = ({
    allowSignInWithCredentials = true,
    onError,
    ...config
}) => {
    /**
     * TODO @ts-refactor
     */
    // @ts-expect-error
    Object.keys(config).forEach(key => config[key] === undefined && delete config[key]);
    Auth.configure({ ...defaultOptions, ...config });

    const idTokenProvider = async () => {
        const user = await Auth.currentSession();
        const idToken = user.getIdToken();

        return idToken ? idToken.getJwtToken() : undefined;
    };

    const Authentication = (props: AuthenticationProps) => {
        const authentication = useAuthentication();
        const { children } = props;
        const [loadingIdentity, setLoadingIdentity] = useState(false);

        const onToken = useCallback(async (token: CognitoIdToken) => {
            const { logout } = token;

            setLoadingIdentity(true);

            try {
                await authentication.login({
                    identityType: "AdminUserIdentity",
                    idTokenProvider,
                    logoutCallback: logout
                });
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
