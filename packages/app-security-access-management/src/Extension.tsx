import React, { memo } from "react";
import { plugins } from "@webiny/plugins";
import { useRouter, AdminConfig, AdminLayout, Wcp } from "@webiny/app-admin";
import { HasPermission } from "@webiny/app-security";
import { Permission } from "~/plugins/constants.js";
import { Groups } from "~/ui/views/Groups/index.js";
import { Teams } from "~/ui/views/Teams/index.js";
import { ApiKeys } from "~/ui/views/ApiKeys/index.js";
import accessManagementPlugins from "./plugins/index.js";
import { Routes } from "~/routes.js";

const { Menu, Route } = AdminConfig;

const AccessManagementExtension = () => {
    const router = useRouter();

    plugins.register(accessManagementPlugins());

    return (
        <AdminConfig>
            <HasPermission name={Permission.Groups}>
                <Route
                    route={Routes.Roles.List}
                    element={
                        <AdminLayout title={"Access Management - Roles"}>
                            <Groups />
                        </AdminLayout>
                    }
                />
            </HasPermission>
            <Wcp.CanUseTeams>
                <HasPermission name={Permission.Teams}>
                    <Route
                        route={Routes.Teams.List}
                        element={
                            <AdminLayout title={"Access Management - Teams"}>
                                <Teams />
                            </AdminLayout>
                        }
                    />
                </HasPermission>
            </Wcp.CanUseTeams>
            <HasPermission name={Permission.ApiKeys}>
                <Route
                    route={Routes.ApiKeys.List}
                    element={
                        <AdminLayout title={"Access Management - API Keys"}>
                            <ApiKeys />
                        </AdminLayout>
                    }
                />
            </HasPermission>

            <HasPermission any={[Permission.Groups, Permission.ApiKeys, Permission.Teams]}>
                <Menu
                    name={"security.settings"}
                    parent={"settings"}
                    element={<Menu.Group text={"Access Management"} />}
                />
            </HasPermission>
            <HasPermission name={Permission.Groups}>
                <Menu
                    name={"security.roles"}
                    parent={"settings"}
                    pinnable={true}
                    element={<Menu.Link text={"Roles"} to={router.getLink(Routes.Roles.List)} />}
                />
            </HasPermission>
            <Wcp.CanUseTeams>
                <HasPermission name={Permission.Teams}>
                    <Menu
                        name={"security.teams"}
                        parent={"settings"}
                        pinnable={true}
                        element={
                            <Menu.Link text={"Teams"} to={router.getLink(Routes.Teams.List)} />
                        }
                    />
                </HasPermission>
            </Wcp.CanUseTeams>

            <HasPermission name={Permission.ApiKeys}>
                <Menu
                    name={"security.apiKeys"}
                    parent={"settings"}
                    pinnable={true}
                    element={
                        <Menu.Link text={"API Keys"} to={router.getLink(Routes.ApiKeys.List)} />
                    }
                />
            </HasPermission>
        </AdminConfig>
    );
};

export const AccessManagement = memo(AccessManagementExtension);
