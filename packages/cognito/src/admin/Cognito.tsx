import React, { Fragment, memo } from "react";
import { AdminConfig, AdminLayout } from "@webiny/app-admin";
import { plugins } from "@webiny/plugins";
import { HasPermission } from "@webiny/app-admin";
import { useRouter } from "@webiny/app-admin";
import { Permission } from "./plugins/constants.js";
import { UsersView } from "./ui/views/Users/UsersView.js";
import { Account } from "./ui/views/Account/index.js";
import { AccountDetails } from "./plugins/userMenu/AccountDetails.js";
import permissionRenderer from "./plugins/permissionRenderer/index.js";
import { CognitoLogin, type CognitoLoginProps } from "./CognitoLogin.js";
import { Routes } from "./routes.js";

const { Route, Menu } = AdminConfig;

export interface CognitoAdminProps {
    login: CognitoLoginProps;
}

const CognitoIdP = (props: CognitoAdminProps) => {
    const { getLink } = useRouter();

    plugins.register([permissionRenderer]);

    return (
        <Fragment>
            <CognitoLogin {...props.login} />
            <AdminConfig>
                <HasPermission name={Permission.Users}>
                    <Route
                        route={Routes.Users.List}
                        element={
                            <AdminLayout title={"Admin Users"}>
                                <UsersView />
                            </AdminLayout>
                        }
                    />

                    <Route
                        route={Routes.Users.Account}
                        element={
                            <AdminLayout title={"User Account"}>
                                <Account />
                            </AdminLayout>
                        }
                    />

                    <Menu
                        name={"cognito.settings"}
                        parent={"settings"}
                        element={<Menu.Group text={"Admin Users"} />}
                    />
                    <Menu
                        name={"cognito.settings.adminUsers"}
                        parent={"settings"}
                        element={
                            <Menu.Link
                                text={"Users"}
                                to={getLink(Routes.Users.List)}
                                pinnable={true}
                            />
                        }
                    />
                </HasPermission>

                <Menu.User
                    name={"accountSettings"}
                    after={"userInfo"}
                    element={<AccountDetails accountRoute={getLink(Routes.Users.Account)} />}
                />
            </AdminConfig>
        </Fragment>
    );
};

export const CognitoAdmin = memo(CognitoIdP);
