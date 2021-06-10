import React from "react";
import Auth from "@aws-amplify/auth";
import { ApolloClient } from "apollo-client";
import { setContext } from "apollo-link-context";
import { PluginCollection } from "@webiny/plugins/types";
import { ApolloLinkPlugin } from "@webiny/app/plugins/ApolloLinkPlugin";
import { Authentication } from "./Authentication";

export type CognitoOptions = {
    region: string;
    userPoolId: string;
    userPoolWebClientId: string;
    getIdentityData(params: {
        client: ApolloClient<any>;
        payload: { [key: string]: any };
    }): Promise<{ [key: string]: any }>;
};

export default ({ getIdentityData, ...amplify }: CognitoOptions): PluginCollection => {
    Auth.configure(amplify);

    const authentication = children => {
        return <Authentication getIdentityData={getIdentityData}>{children}</Authentication>;
    };

    return [
        new ApolloLinkPlugin(() => {
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

                // If "Authorization" header is already set, don't overwrite it.
                if (headers && headers.Authorization) {
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
        }),
        {
            type: "app-installer-security",
            render: authentication
        }
    ];
};
