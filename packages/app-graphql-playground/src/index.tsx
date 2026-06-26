import React, { memo } from "react";
import { plugins } from "@webiny/plugins";
import { useRouter, AdminConfig, AdminLayout, HasPermission } from "@webiny/app-admin";
import { ReactComponent as ApiPlaygroundIcon } from "@webiny/icons/graphql_playground.svg";
import { ReactComponent as DevToolsIcon } from "@webiny/icons/developer_mode.svg";
// import { Playground } from "./plugins/Playground.js";
import playgroundPlugins from "./plugins/index.js";
import { SecurityPermission } from "./SecurityPermission.js";
import { Routes } from "~/routes.js";

const { Route, Menu } = AdminConfig;

const GraphQLPlaygroundExtension = () => {
    const router = useRouter();
    plugins.register(playgroundPlugins);

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
                        <AdminLayout title={"GraphQL Playground"}>{/*<Playground />*/}</AdminLayout>
                    }
                />
            </AdminConfig>
        </>
    );
};

export const GraphQLPlayground = memo(GraphQLPlaygroundExtension);
