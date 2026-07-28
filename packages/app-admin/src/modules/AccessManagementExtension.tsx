import React, { Fragment } from "react";
import { useRouter } from "@webiny/app";
import { RegisterFeature } from "~/components/RegisterFeature.js";
import { AdminConfig } from "~/config/AdminConfig.js";
import { AdminLayout } from "~/components/AdminLayout.js";
import { HasPermission } from "~/presentation/security/components/HasPermission.js";
import { Wcp } from "~/components/Wcp.js";
import { Permission } from "~/features/accessManagement/constants.js";
import { SecurityPermissionsFeature } from "~/features/accessManagement/permissions/feature.js";
import { ListRolesFeature } from "~/features/accessManagement/roles/listRoles/feature.js";
import { GetRoleFeature } from "~/features/accessManagement/roles/getRole/feature.js";
import { CreateRoleFeature } from "~/features/accessManagement/roles/createRole/feature.js";
import { UpdateRoleFeature } from "~/features/accessManagement/roles/updateRole/feature.js";
import { DeleteRoleFeature } from "~/features/accessManagement/roles/deleteRole/feature.js";
import { ListTeamsFeature } from "~/features/accessManagement/teams/listTeams/feature.js";
import { GetTeamFeature } from "~/features/accessManagement/teams/getTeam/feature.js";
import { CreateTeamFeature } from "~/features/accessManagement/teams/createTeam/feature.js";
import { UpdateTeamFeature } from "~/features/accessManagement/teams/updateTeam/feature.js";
import { DeleteTeamFeature } from "~/features/accessManagement/teams/deleteTeam/feature.js";
import { ListApiKeysFeature } from "~/features/accessManagement/apiKeys/listApiKeys/feature.js";
import { GetApiKeyFeature } from "~/features/accessManagement/apiKeys/getApiKey/feature.js";
import { CreateApiKeyFeature } from "~/features/accessManagement/apiKeys/createApiKey/feature.js";
import { UpdateApiKeyFeature } from "~/features/accessManagement/apiKeys/updateApiKey/feature.js";
import { DeleteApiKeyFeature } from "~/features/accessManagement/apiKeys/deleteApiKey/feature.js";
import { ListPresenterFeature } from "~/presentation/listPresenter/feature.js";
import { RolesPresenterFeature } from "~/presentation/accessManagement/roles/feature.js";
import { SecurityPermissions } from "~/presentation/accessManagement/SecurityPermissions.js";
import { Routes } from "~/presentation/accessManagement/routes.js";
import { RolesView } from "~/presentation/accessManagement/roles/components/RolesView.js";
import { TeamsView } from "~/presentation/accessManagement/teams/components/TeamsView.js";
import { ApiKeysView } from "~/presentation/accessManagement/apiKeys/components/ApiKeysView.js";
import { ApiKeysPresenterFeature } from "~/presentation/accessManagement/apiKeys/feature.js";
import { TeamsPresenterFeature } from "~/presentation/accessManagement/teams/feature.js";

const { Menu, Route } = AdminConfig;

export const AccessManagementExtension = () => {
    const router = useRouter();

    return (
        <Fragment>
            <RegisterFeature feature={SecurityPermissionsFeature} />
            <RegisterFeature feature={ListPresenterFeature} />
            <RegisterFeature feature={ListRolesFeature} />
            <RegisterFeature feature={GetRoleFeature} />
            <RegisterFeature feature={CreateRoleFeature} />
            <RegisterFeature feature={UpdateRoleFeature} />
            <RegisterFeature feature={DeleteRoleFeature} />
            <RegisterFeature feature={RolesPresenterFeature} />
            <RegisterFeature feature={ListTeamsFeature} />
            <RegisterFeature feature={GetTeamFeature} />
            <RegisterFeature feature={CreateTeamFeature} />
            <RegisterFeature feature={UpdateTeamFeature} />
            <RegisterFeature feature={DeleteTeamFeature} />
            <RegisterFeature feature={TeamsPresenterFeature} />
            <RegisterFeature feature={ListApiKeysFeature} />
            <RegisterFeature feature={GetApiKeyFeature} />
            <RegisterFeature feature={CreateApiKeyFeature} />
            <RegisterFeature feature={UpdateApiKeyFeature} />
            <RegisterFeature feature={DeleteApiKeyFeature} />
            <RegisterFeature feature={ApiKeysPresenterFeature} />
            <SecurityPermissions />
            <AdminConfig>
                <HasPermission name={Permission.Roles}>
                    <Route
                        route={Routes.Roles.List}
                        element={
                            <AdminLayout title={"Access Management - Roles"}>
                                <RolesView />
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
                                    <TeamsView />
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
                                <ApiKeysView />
                            </AdminLayout>
                        }
                    />
                </HasPermission>

                <HasPermission any={[Permission.Roles, Permission.ApiKeys, Permission.Teams]}>
                    <Menu
                        name={"settings.security"}
                        parent={"settings"}
                        element={<Menu.Group text={"Access Management"} collapsible={false} />}
                    />
                </HasPermission>
                <HasPermission name={Permission.Roles}>
                    <Menu
                        name={"security.roles"}
                        parent={"settings.security"}
                        element={
                            <Menu.Link
                                text={"Roles"}
                                to={router.getLink(Routes.Roles.List)}
                                pinnable={true}
                            />
                        }
                    />
                </HasPermission>
                <Wcp.CanUseTeams>
                    <HasPermission name={Permission.Teams}>
                        <Menu
                            name={"security.teams"}
                            parent={"settings.security"}
                            element={
                                <Menu.Link
                                    text={"Teams"}
                                    to={router.getLink(Routes.Teams.List)}
                                    pinnable={true}
                                />
                            }
                        />
                    </HasPermission>
                </Wcp.CanUseTeams>
                <HasPermission name={Permission.ApiKeys}>
                    <Menu
                        name={"security.apiKeys"}
                        parent={"settings.security"}
                        element={
                            <Menu.Link
                                text={"API Keys"}
                                to={router.getLink(Routes.ApiKeys.List)}
                                pinnable={true}
                            />
                        }
                    />
                </HasPermission>
            </AdminConfig>
        </Fragment>
    );
};
