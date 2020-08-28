import React from "react";
import Auth from "@aws-amplify/auth";
import { setContext } from "apollo-link-context";
import Authentication from "./Authentication";
import { ApolloClient } from "apollo-client";

export type CognitoOptions = {
    region: string;
    userPoolId: string;
    userPoolWebClientId: string;
    getIdentityData(params: {
        client: ApolloClient<any>;
        payload: { [key: string]: any };
    }): Promise<{ [key: string]: any }>;
};

export default ({ getIdentityData, ...amplify }: CognitoOptions) => {
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
                    const user = await Auth.currentSession();
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
