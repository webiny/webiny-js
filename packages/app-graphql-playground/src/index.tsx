import React, { memo } from "react";
import type { ApolloClient } from "apollo-client";
import { useRouter, AdminConfig, AdminLayout, HasPermission } from "@webiny/app-admin";
import { ReactComponent as ApiPlaygroundIcon } from "@webiny/icons/graphql_playground.svg";
import { ReactComponent as DevToolsIcon } from "@webiny/icons/developer_mode.svg";
import { SecurityPermission } from "./SecurityPermission.js";
import { Routes } from "~/routes.js";
import { PlaygroundPage } from "./presentation/Playground/components/PlaygroundPage.js";

const { Route, Menu } = AdminConfig;

interface CreateApolloClientParams {
    uri: string;
}

interface GraphQLPlaygroundProps {
    createApolloClient(params: CreateApolloClientParams): ApolloClient<any>;
}

const GraphQLPlaygroundExtension = ({
    createApolloClient: _createApolloClient
}: GraphQLPlaygroundProps) => {
    const router = useRouter();

    return (
        <>
            <SecurityPermission />
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
                <HasPermission any={["dev-tools.*", "dev-tools.graphql-playground.*"]}>
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
                </HasPermission>

                <Route
                    route={Routes.ApiPlayground}
                    element={
                        <AdminLayout title={"GraphQL Playground"}>
                            <PlaygroundPage />
                        </AdminLayout>
                    }
                />
            </AdminConfig>
        </>
    );
};

export const GraphQLPlayground = memo(GraphQLPlaygroundExtension);
