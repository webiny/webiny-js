import React, { Fragment, memo } from "react";
import { AdminConfig, AdminLayout } from "@webiny/app-admin";
import { HasPermission } from "@webiny/app-admin";
import { useRouter } from "@webiny/app-admin";
import { Permission } from "./plugins/constants.js";
import { UsersView } from "./ui/views/Users/UsersView.js";
import { UserAccountForm } from "./ui/views/Account/index.js";
import { AccountDetails } from "./plugins/userMenu/AccountDetails.js";
import { SecurityPermission } from "./SecurityPermission.js";
import { CognitoLogin, type CognitoLoginProps } from "./CognitoLogin.js";
import { Routes } from "./routes.js";

const { Route, Menu } = AdminConfig;

export interface CognitoAdminProps {
    login: CognitoLoginProps;
}

const CognitoIdP = (props: CognitoAdminProps) => {
    const { getLink } = useRouter();

    return (
        <Fragment>
            <SecurityPermission />
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
                                <UserAccountForm />
                            </AdminLayout>
                        }
                    />

                    <Menu
                        name={"cognito.settings.adminUsers"}
                        parent={"settings"}
                        after={"security.settings"}
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
