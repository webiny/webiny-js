import React from "react";
import Helmet from "react-helmet";
import ApolloClient from "apollo-client";
import { Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import { RoutePlugin } from "@webiny/app/types";
import { ReactComponent as InfoIcon } from "./graphql.svg";
import Playground from "./Playground";
import { GraphQLPlaygroundTabPlugin } from "../types";
// @ts-ignore
import placeholder from "!!raw-loader!./placeholder.graphql";
import { NavigationMenuElement } from "@webiny/app-admin/ui/elements/NavigationMenuElement";
import { UIViewPlugin } from "@webiny/app-admin/ui/UIView";
import { NavigationView } from "@webiny/app-admin/ui/views/NavigationView";

type GraphQLPlaygroundOptions = {
    createApolloClient(params: { uri: string }): ApolloClient<any>;
};

// @ts-ignore
export default (options: GraphQLPlaygroundOptions) => [
    new UIViewPlugin<NavigationView>(NavigationView, view => {
        view.getFooterElement().addMenuElement(
            new NavigationMenuElement("apiPlayground", {
                label: "API Playground",
                icon: <InfoIcon />,
                path: "/api-playground",
                onClick: () => {
                    view.getNavigationHook().hideMenu();
                }
            })
        );
    }),
    {
        name: "route-api-playground",
        type: "route",
        route: (
            <Route
                exact
                path={"/api-playground"}
                render={() => (
                    <AdminLayout>
                        <Helmet>
                            <title>API Playground</title>
                        </Helmet>
                        <Playground createApolloClient={options.createApolloClient} />
                    </AdminLayout>
                )}
            />
        )
    } as RoutePlugin,
    {
        type: "graphql-playground-tab",
        tab() {
            return {
                name: "Main API",
                endpoint: process.env.REACT_APP_API_URL + "/graphql",
                headers: {},
                query: placeholder
            };
        }
    } as GraphQLPlaygroundTabPlugin
];
