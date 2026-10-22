import React from "react";
import { Fragment } from "react";
import { memo } from "react";
import { useMemo } from "react";
import { useRouter } from "@webiny/app";
import { AdminConfig } from "~/config/AdminConfig.js";
import { AdminLayout } from "~/components/AdminLayout.js";
import { RegisterFeature } from "~/components/RegisterFeature.js";
import { HasPermission } from "~/presentation/security/components/HasPermission.js";
import { AdminUsersPermissionsFeature } from "~/features/adminUsers/permissions/feature.js";
import { GetCurrentUserFeature } from "~/features/adminUsers/account/getCurrentUser/index.js";
import { UpdateCurrentUserFeature } from "~/features/adminUsers/account/updateCurrentUser/index.js";
import { ListUsersFeature } from "~/features/adminUsers/users/listUsers/index.js";
import { GetUserFeature } from "~/features/adminUsers/users/getUser/index.js";
import { CreateUserFeature } from "~/features/adminUsers/users/createUser/index.js";
import { UpdateUserFeature } from "~/features/adminUsers/users/updateUser/index.js";
import { DeleteUserFeature } from "~/features/adminUsers/users/deleteUser/index.js";
import { UsersView } from "./views/Users/UsersView.js";
import { UserAccountForm } from "./views/Account/index.js";
import { SecurityPermission } from "./SecurityPermission.js";
import { AccountDetails } from "./userMenu/AccountDetails.js";
import { AdminUsersSettingsFeature } from "~/features/adminUsers/settings/index.js";
import { Routes } from "./routes.js";

const { Route, Menu } = AdminConfig;

export interface AdminUsersProps {
    /**
     * Whether an existing user's email can be changed. On by default; an identity provider whose
     * users cannot change their address turns it off. The password rules come from the build, see
     * `readPasswordPolicyRules`.
     */
    emailChangeable?: boolean;
}

/**
 * The Users screen, the Account screen, and the "Admin Users" permission, for identity providers
 * whose users are created and edited in Webiny. Rendered by such a provider's admin extension, which
 * also has to serve the `adminUsers` create, update and delete mutations behind these screens.
 */
const AdminUsersComponent = ({ emailChangeable = true }: AdminUsersProps) => {
    // One object per value, because `RegisterFeature` registers again whenever its options change.
    const settings = useMemo(() => ({ emailChangeable }), [emailChangeable]);
    const { getLink } = useRouter();

    return (
        <Fragment>
            <RegisterFeature feature={AdminUsersPermissionsFeature} />
            <RegisterFeature feature={AdminUsersSettingsFeature} options={settings} />
            <RegisterFeature feature={GetCurrentUserFeature} />
            <RegisterFeature feature={UpdateCurrentUserFeature} />
            <RegisterFeature feature={ListUsersFeature} />
            <RegisterFeature feature={GetUserFeature} />
            <RegisterFeature feature={CreateUserFeature} />
            <RegisterFeature feature={UpdateUserFeature} />
            <RegisterFeature feature={DeleteUserFeature} />
            <SecurityPermission />
            <AdminConfig>
                <HasPermission name={"adminUsers.user"}>
                    <Route
                        route={Routes.Users.List}
                        element={
                            <AdminLayout title={"Admin Users"}>
                                <AdminConfig.Breadcrumb name={"users"} label={"Users"} />
                                <UsersView />
                            </AdminLayout>
                        }
                    />

                    <Menu
                        name={"security.adminUsers"}
                        parent={"settings.security"}
                        before={"$first"}
                        element={
                            <Menu.Link
                                text={"Users"}
                                to={getLink(Routes.Users.List)}
                                pinnable={true}
                            />
                        }
                    />
                </HasPermission>

                {/* Not behind `adminUsers.user`: every user can change their own details, and the
                    menu item below links here for everyone. */}
                <Route
                    route={Routes.Users.Account}
                    element={
                        <AdminLayout title={"User Account"}>
                            <AdminConfig.Breadcrumb name={"account"} label={"Account"} />
                            <UserAccountForm />
                        </AdminLayout>
                    }
                />

                <Menu.User
                    name={"accountSettings"}
                    after={"userInfo"}
                    element={<AccountDetails accountRoute={getLink(Routes.Users.Account)} />}
                />
            </AdminConfig>
        </Fragment>
    );
};

export const AdminUsers = memo(AdminUsersComponent);
