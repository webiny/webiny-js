import React, { Fragment, memo } from "react";
import {
    Compose,
    Extensions,
    LoginScreenRenderer,
    AddMenu as Menu,
    AddUserMenuItem,
    AddRoute,
    Layout
} from "@webiny/app-admin";
import { plugins } from "@webiny/plugins";
import { HasPermission } from "@webiny/app-security";
import { Permission } from "~/plugins/constants";
import { createAuthentication } from "~/createAuthentication";
import { UsersView } from "~/ui/views/Users/UsersView";
import { Account } from "~/ui/views/Account";
import { UserInfo } from "./plugins/userMenu/userInfo";
import { AccountDetails } from "./plugins/userMenu/accountDetails";
import { SignOut } from "./plugins/userMenu/signOut";

import { globalSearchUsers } from "./plugins/globalSearch";
import installation from "./plugins/installation";
import permissionRenderer from "./plugins/permissionRenderer";
import cognito from "./plugins/cognito";

const LoginScreen = createAuthentication();

const CognitoLoginScreen = () => LoginScreen;

const CognitoIdP = () => {
    plugins.register([globalSearchUsers, installation, permissionRenderer, cognito()]);

    return (
        <Fragment>
            <Compose component={LoginScreenRenderer} with={CognitoLoginScreen} />
            <Extensions>
                <HasPermission name={Permission.Users}>
                    <AddRoute exact path={"/admin-users"}>
                        <Layout title={"Admin Users"}>
                            <UsersView />
                        </Layout>
                    </AddRoute>
                    <Menu id={"settings"}>
                        <Menu id={"cognito.adminUsers"} label={"Admin Users"}>
                            <Menu
                                id={"cognito.adminUsers.users"}
                                label={"Users"}
                                path={"/admin-users"}
                            />
                        </Menu>
                    </Menu>
                </HasPermission>
                <AddRoute exact path={"/account"}>
                    <Layout title={"User Account"}>
                        <Account />
                    </Layout>
                </AddRoute>
                <AddUserMenuItem element={<UserInfo />} />
                <AddUserMenuItem element={<AccountDetails />} />
                <AddUserMenuItem element={<SignOut />} />
            </Extensions>
        </Fragment>
    );
};

export const Cognito = memo(CognitoIdP);
