import React, { memo } from "react";
import { useRouter } from "@webiny/app-admin";
import { AdminConfig } from "@webiny/app-admin";
import { AdminLayout } from "@webiny/app-admin";
import { HasPermission } from "@webiny/app-admin";
import { RegisterFeature } from "@webiny/app-admin";
import { ReactComponent as ApiPlaygroundIcon } from "@webiny/icons/graphql_playground.svg";
import { ReactComponent as DevToolsIcon } from "@webiny/icons/developer_mode.svg";
import { SecurityPermission } from "./SecurityPermission.js";
import { Routes } from "~/routes.js";
import { PlaygroundPage } from "./presentation/Playground/components/PlaygroundPage.js";
import { PlaygroundClientFeature } from "./features/playgroundClient/feature.js";
import { PlaygroundTabRegistryFeature } from "./features/tabRegistry/feature.js";
import { PlaygroundRepositoryFeature } from "./features/repository/feature.js";
import { PlaygroundPresenterFeature } from "./presentation/Playground/feature.js";
import { DocsExplorerFeature } from "./presentation/DocsExplorer/feature.js";

const { Route, Menu } = AdminConfig;

const GraphQLPlaygroundExtension = () => {
    const router = useRouter();

    return (
        <>
            <RegisterFeature feature={PlaygroundClientFeature} />
            <RegisterFeature feature={PlaygroundTabRegistryFeature} />
            <RegisterFeature feature={PlaygroundRepositoryFeature} />
            <RegisterFeature feature={PlaygroundPresenterFeature} />
            <RegisterFeature feature={DocsExplorerFeature} />
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
