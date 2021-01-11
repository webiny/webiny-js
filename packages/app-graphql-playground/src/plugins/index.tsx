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
import { GraphQLPlaygroundTabPlugin } from "@webiny/app-graphql-playground/types";
// @ts-ignore
import placeholder from "!!raw-loader!./placeholder.graphql";

const t = i18n.ns("app-admin/navigation");

type GraphQLPlaygroundOptions = {
    createApolloClient(params: { uri: string }): ApolloClient<any>;
};

// @ts-ignore
export default (options: GraphQLPlaygroundOptions) => [
    {
        type: "admin-drawer-footer-menu",
        name: "admin-drawer-footer-menu-api-playground",
        render({ hideMenu }) {
            return (
                <Link to="/api-playground">
                    <ListItem ripple={false} onClick={hideMenu}>
                        <ListItemGraphic>
                            <Icon icon={<InfoIcon />} />
                        </ListItemGraphic>
                        {t`API Playground`}
                    </ListItem>
                </Link>
            );
        }
    } as AdminDrawerFooterMenuPlugin,
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
