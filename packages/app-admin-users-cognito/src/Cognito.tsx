import React, { Fragment, memo } from "react";
import {
    Compose,
    Plugins,
    LoginScreenRenderer,
    AddMenu as Menu,
    AddUserMenuItem,
    AddRoute,
    Layout,
    HigherOrderComponent
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

import installation from "./plugins/installation";
import permissionRenderer from "./plugins/permissionRenderer";
import cognito from "./plugins/cognito";

/**
 * TODO @ts-refactor figure out correct LoginScreenTypes.
 */
// @ts-ignore
const LoginScreen: React.FC = createAuthentication();

const CognitoLoginScreen: HigherOrderComponent = () => LoginScreen;
/**
 * TODO @ts-refactor @pavel
 * Compose.component
 */
const CognitoIdP: React.FC = () => {
    plugins.register([installation, permissionRenderer, cognito()]);

    return (
        <Fragment>
            <Compose component={LoginScreenRenderer} with={CognitoLoginScreen} />
            <Plugins>
                <HasPermission name={Permission.Users}>
                    <AddRoute exact path={"/admin-users"}>
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
                <AddRoute exact path={"/account"}>
                    <Layout title={"User Account"}>
                        <Account />
                    </Layout>
                </AddRoute>
                <AddUserMenuItem element={<UserInfo />} />
                <AddUserMenuItem element={<AccountDetails />} />
                <AddUserMenuItem element={<SignOut />} />
            </Plugins>
        </Fragment>
    );
};

export const Cognito = memo(CognitoIdP);
