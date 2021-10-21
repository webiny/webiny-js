import React, { useCallback, useEffect } from "react";
import { Auth } from "@aws-amplify/auth";
import { AuthOptions } from "@aws-amplify/auth/lib-esm/types";
import ApolloClient from "apollo-client";
import { useApolloClient } from "@apollo/react-hooks";
import { setContext } from "apollo-link-context";
import { plugins } from "@webiny/plugins";
import { ApolloLinkPlugin } from "@webiny/app/plugins/ApolloLinkPlugin";
import { CognitoIdToken } from "@webiny/app-cognito-authenticator/types";
import { Authenticator } from "@webiny/app-cognito-authenticator/Authenticator";
import CheckingUser from "~/views/CheckingUser";
import SignIn from "~/views/SignIn";
import RequireNewPassword from "~/views/RequireNewPassword";
import ForgotPassword from "~/views/ForgotPassword";
import SetNewPassword from "~/views/SetNewPassword";
import SignedIn from "~/views/SignedIn";
import { useSecurity } from "@webiny/app-security";
const createApolloLinkPlugin = () => {
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
    region: process.env.REACT_APP_USER_POOL_REGION,
    userPoolId: process.env.REACT_APP_USER_POOL_ID,
    userPoolWebClientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID
};

export interface Props {
    children: React.ReactNode;
}

export interface Config extends AuthOptions {
    onError?(error: Error): void;
    getIdentityData(params: {
        client: ApolloClient<any>;
        payload: { [key: string]: any };
    }): Promise<{ [key: string]: any }>;
}

export const createAuthentication = ({ getIdentityData, onError, ...config }: Config) => {
    Object.keys(config).forEach(key => config[key] === undefined && delete config[key]);
    Auth.configure({ ...defaultOptions, ...config });

    const Authentication = (props: Props) => {
        const { children } = props;
        const { setIdentity } = useSecurity();
        const client = useApolloClient();

        const onToken = useCallback(async (token: CognitoIdToken) => {
            const { payload, logout } = token;

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
                    logout
                });
            } catch (err) {
                console.log("ERROR", err);
                if (typeof onError === "function") {
                    onError(err);
                } else {
                    console.error(err);
                }
            }
        }, []);

        useEffect(() => {
            plugins.register(createApolloLinkPlugin());
        }, []);

        return (
            <Authenticator onToken={onToken}>
                <CheckingUser />
                <SignIn />
                <RequireNewPassword />
                <ForgotPassword />
                <SetNewPassword />
                <SignedIn>{children}</SignedIn>
            </Authenticator>
        );
    };

    return Authentication;
};
