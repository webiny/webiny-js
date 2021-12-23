import React from "react";
import ApolloClient from "apollo-client";
import { Route } from "@webiny/react-router";
import { Layout } from "@webiny/app-admin";
import { RoutePlugin } from "@webiny/app/types";
import Playground from "./Playground";
import { GraphQLPlaygroundTabPlugin } from "~/types";
// @ts-ignore
import placeholder from "!!raw-loader!./placeholder.graphql";
import { config as appConfig } from "@webiny/app/config";

type GraphQLPlaygroundOptions = {
    createApolloClient(params: { uri: string }): ApolloClient<any>;
};

export default (options: GraphQLPlaygroundOptions) => [
    {
        name: "route-api-playground",
        type: "route",
        route: (
            <Route
                exact
                path={"/api-playground"}
                render={() => (
                    <Layout title={"API Playground"}>
                        <Playground createApolloClient={options.createApolloClient} />
                    </Layout>
                )}
            />
        )
    } as RoutePlugin,
    {
        type: "graphql-playground-tab",
        tab() {
            const apiUrl = appConfig.getKey("API_URL", process.env.REACT_APP_API_URL);
            return {
                name: "Main API",
                endpoint: apiUrl + "/graphql",
                headers: {},
                query: placeholder
            };
        }
    } as GraphQLPlaygroundTabPlugin
];
