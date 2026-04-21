import React, { memo } from "react";
import type { ApolloClient } from "apollo-client";
import { plugins } from "@webiny/plugins";
import { useRouter, AdminConfig, AdminLayout } from "@webiny/app-admin";
import { ReactComponent as ApiPlaygroundIcon } from "@webiny/icons/graphql_playground.svg";
import { ReactComponent as DevToolsIcon } from "@webiny/icons/developer_mode.svg";
import Playground from "./plugins/Playground.js";
import playgroundPlugins from "./plugins/index.js";
import { Routes } from "~/routes.js";

const { Route, Menu } = AdminConfig;

interface CreateApolloClientParams {
    uri: string;
}

interface GraphQLPlaygroundProps {
    createApolloClient(params: CreateApolloClientParams): ApolloClient<any>;
}

const GraphQLPlaygroundExtension = ({ createApolloClient }: GraphQLPlaygroundProps) => {
    const router = useRouter();
    plugins.register(playgroundPlugins);

    return (
        <AdminConfig>
            <Menu
                name={"dev-tools"}
                hideIfEmpty={true}
                pin={"end"}
                element={
                    <Menu.Item
                        text={"Dev Tools"}
                        icon={<Menu.Item.Icon label="Dev Tools" element={<DevToolsIcon />} />}
                    />
                }
            />
            <Menu
                name={"dev-tools.graphql"}
                parent={"dev-tools"}
                element={
                    <Menu.Link
                        text={"GraphQL Playground"}
                        to={router.getLink(Routes.ApiPlayground)}
                        icon={
                            <Menu.Link.Icon
                                label="GraphQL Playground"
                                element={<ApiPlaygroundIcon />}
                            />
                        }
                    />
                }
            />

            <Route
                route={Routes.ApiPlayground}
                element={
                    <AdminLayout title={"GraphQL Playground"}>
                        <Playground createApolloClient={createApolloClient} />
                    </AdminLayout>
                }
            />
        </AdminConfig>
    );
};

export const GraphQLPlayground = memo(GraphQLPlaygroundExtension);
