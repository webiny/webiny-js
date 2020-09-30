import React from "react";
import Auth from "@aws-amplify/auth";
import { setContext } from "apollo-link-context";
import Authentication from "./Authentication";
import { ApolloClient } from "apollo-client";
import { LOGIN } from "@webiny/app-security-user-management/graphql";

export type CognitoOptions = {
    region: string;
    userPoolId: string;
    userPoolWebClientId: string;
    getIdentityData?(params: {
        client: ApolloClient<any>;
        payload: { [key: string]: any };
    }): Promise<{ [key: string]: any }>;
};

export const defaultGetIdentityData = async ({ client }) => {
    const { data } = await client.mutate({ mutation: LOGIN });
    const identity = data.security.login.data;

    return {
        ...identity,
        avatar: identity.avatar ? identity.avatar : { src: identity.gravatar }
    };
};

export default ({ getIdentityData = defaultGetIdentityData, ...amplify }: CognitoOptions) => {
    Auth.configure(amplify);

    const authentication = children => {
        return <Authentication getIdentityData={getIdentityData}>{children}</Authentication>;
    };

    return [
        {
            name: "apollo-link-cognito-context",
            type: "apollo-link",
            createLink() {
                return setContext(async (_, { headers }) => {
                    let user;
                    try {
                        user = await Auth.currentSession();
                    } catch (error) {
                        console.error(error);
                    }

                    if (!user) {
                        return { headers };
                    }

                    const idToken = user.getIdToken().getJwtToken();
                    return {
                        headers: {
                            ...headers,
                            Authorization: `Bearer ${idToken}`
                        }
                    };
                });
            }
        },
        {
            type: "app-template-renderer",
            render: authentication
        },
        {
            type: "app-installer-security",
            render: authentication
        }
    ];
};
