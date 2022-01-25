import React, { memo } from "react";
import { plugins } from "@webiny/plugins";
import { Layout, Plugins, AddMenu, AddRoute } from "@webiny/app-admin";
import { HasPermission } from "@webiny/app-security";
import { Permission } from "~/plugins/constants";
import { Groups } from "~/ui/views/Groups";
import { ApiKeys } from "~/ui/views/ApiKeys";
import accessManagementPugins from "./plugins";

/**
 * TODO @ts-refactor
 * Find out why is there empty default export
 */
// @ts-ignore
export default () => [];

export const AccessManagementExtension = () => {
    plugins.register(accessManagementPugins());

    return (
        <Plugins>
            <HasPermission name={Permission.Groups}>
                <AddRoute exact path={"/access-management/groups"}>
                    <Layout title={"Access Management - Groups"}>
                        <Groups />
                    </Layout>
                </AddRoute>
            </HasPermission>
            <HasPermission name={Permission.ApiKeys}>
                <AddRoute exact path={"/access-management/api-keys"}>
                    <Layout title={"Access Management - API Keys"}>
                        <ApiKeys />
                    </Layout>
                </AddRoute>
            </HasPermission>
            <HasPermission any={[Permission.Groups, Permission.ApiKeys]}>
                <AddMenu name={"settings"}>
                    <AddMenu name={"settings.accessManagement"} label={"Access Management"}>
                        <HasPermission name={Permission.Groups}>
                            <AddMenu
                                name={"settings.accessManagement.groups"}
                                label={"Groups"}
                                path={"/access-management/groups"}
                            />
                        </HasPermission>
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
