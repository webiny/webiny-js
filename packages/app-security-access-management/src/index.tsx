import React, { memo } from "react";
import { plugins } from "@webiny/plugins";
import { AddMenu, AddRoute, Layout, Plugins, useWcp } from "@webiny/app-admin";
import { HasPermission } from "@webiny/app-security";
import { Permission } from "~/plugins/constants";
import { Groups } from "~/ui/views/Groups";
import { Teams } from "~/ui/views/Teams";
import { ApiKeys } from "~/ui/views/ApiKeys";
import accessManagementPlugins from "./plugins";

/**
 * TODO @ts-refactor
 * Find out why is there empty default export
 */
export default () => [];

export const AccessManagementExtension = () => {
    plugins.register(accessManagementPlugins());

    const { getProject } = useWcp();

    const project = getProject();
    let teams = false;
    if (project) {
        teams = project.package.features.advancedAccessControlLayer.options.teams;
    }

    return (
        <Plugins>
            <HasPermission name={Permission.Groups}>
                <AddRoute exact path={"/access-management/roles"}>
                    <Layout title={"Access Management - Roles"}>
                        <Groups />
                    </Layout>
                </AddRoute>
            </HasPermission>{" "}
            {teams && (
                <HasPermission name={Permission.Teams}>
                    <AddRoute exact path={"/access-management/teams"}>
                        <Layout title={"Access Management - Teams"}>
                            <Teams />
                        </Layout>
                    </AddRoute>
                </HasPermission>
            )}
            <HasPermission name={Permission.ApiKeys}>
                <AddRoute exact path={"/access-management/api-keys"}>
                    <Layout title={"Access Management - API Keys"}>
                        <ApiKeys />
                    </Layout>
                </AddRoute>
            </HasPermission>
            <HasPermission any={[Permission.Groups, Permission.ApiKeys, Permission.Teams]}>
                <AddMenu name={"settings"}>
                    <AddMenu name={"settings.accessManagement"} label={"Access Management"}>
                        <HasPermission name={Permission.Groups}>
                            <AddMenu
                                name={"settings.accessManagement.roles"}
                                label={"Roles"}
                                path={"/access-management/roles"}
                            />
                        </HasPermission>
                        {teams && (
                            <HasPermission name={Permission.Teams}>
                                <AddMenu
                                    name={"settings.accessManagement.teams"}
                                    label={"Teams"}
                                    path={"/access-management/teams"}
                                />
                            </HasPermission>
                        )}

                        <HasPermission name={Permission.ApiKeys}>
                            <AddMenu
                                name={"settings.accessManagement.apiKeys"}
                                label={"API Keys"}
                                path={"/access-management/api-keys"}
                            />
                        </HasPermission>
                    </AddMenu>
                </AddMenu>
            </HasPermission>
        </Plugins>
    );
};

export const AccessManagement = memo(AccessManagementExtension);
