import React, { Fragment, memo } from "react";
import { Plugin, AddMenu as Menu, AddUserMenuItem, AddRoute, Layout } from "@webiny/app-admin";
import { plugins } from "@webiny/plugins";
import { HasPermission } from "@webiny/app-security";
import { Permission } from "~/plugins/constants";
import { UsersView } from "~/ui/views/Users/UsersView";
import { Account } from "~/ui/views/Account";
import { UserInfo } from "./plugins/userMenu/userInfo";
import { AccountDetails } from "./plugins/userMenu/accountDetails";
import { SignOut } from "./plugins/userMenu/signOut";

import installation from "./plugins/installation";
import permissionRenderer from "./plugins/permissionRenderer";
import cognito from "./plugins/cognito";
import { CognitoLogin, CognitoProps } from "./CognitoLogin";

const ACCOUNT_ROUTE = "/account";

const CognitoIdP = (props: CognitoProps) => {
    plugins.register([installation, permissionRenderer, cognito()]);

    return (
        <Fragment>
            <CognitoLogin
                config={props.config}
                userMenuItems={{ userInfo: false, signOut: false }}
            />
            <Plugin>
                <HasPermission name={Permission.Users}>
                    <AddRoute path={"/admin-users"}>
                        <Layout title={"Admin Users"}>
                            <UsersView />
                        </Layout>
                    </AddRoute>
                    <Menu name={"settings"}>
                        <Menu name={"cognito.adminUsers"} label={"Admin Users"}>
                            <Menu
                                name={"cognito.adminUsers.users"}
                                label={"Users"}
                                path={"/admin-users"}
                            />
                        </Menu>
                    </Menu>
                </HasPermission>
                <AddRoute path={ACCOUNT_ROUTE}>
                    <Layout title={"User Account"}>
                        <Account />
                    </Layout>
                </AddRoute>
                <AddUserMenuItem element={<UserInfo accountRoute={ACCOUNT_ROUTE} />} />
                <AddUserMenuItem element={<AccountDetails accountRoute={ACCOUNT_ROUTE} />} />
                <AddUserMenuItem element={<SignOut />} />
            </Plugin>
        </Fragment>
    );
};

export const Cognito = memo(CognitoIdP);
