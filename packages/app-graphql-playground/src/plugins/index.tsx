import React from "react";
import Helmet from "react-helmet";
import ApolloClient from "apollo-client";
import { AdminDrawerFooterMenuPlugin } from "@webiny/app-admin/types";
import { ListItem, ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { i18n } from "@webiny/app/i18n";
import { Link, Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import { RoutePlugin } from "@webiny/app/types";
import { ReactComponent as InfoIcon } from "./graphql.svg";
import Playground from "./Playground";
import { GraphQLPlaygroundTabPlugin } from "../types";
// @ts-ignore
import placeholder from "!!raw-loader!./placeholder.graphql";
import { NavigationViewPlugin } from "@webiny/app-admin/plugins/NavigationViewPlugin";
import { NavigationMenuElement } from "@webiny/app-admin/elements/NavigationMenuElement";

const t = i18n.ns("app-admin/navigation");

type GraphQLPlaygroundOptions = {
    createApolloClient(params: { uri: string }): ApolloClient<any>;
};

// @ts-ignore
export default (options: GraphQLPlaygroundOptions) => [
    new NavigationViewPlugin(view => {
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
