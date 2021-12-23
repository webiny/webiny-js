import React, { Fragment } from "react";
import {
    Compose,
    Extensions,
    LoginScreenRenderer,
    AddMenu as Menu,
    AddUserMenuItem,
    AddRoute,
    Layout
} from "@webiny/app-admin";
import { HasPermission } from "@webiny/app-security";
import { Permission } from "~/plugins/constants";
import { createAuthentication } from "~/createAuthentication";
import { UIViewComponent } from "@webiny/app-admin/ui/UIView";
import { UsersView } from "~/ui/views/Users/UsersView";
import { Account } from "~/ui/views/Account";
import { UserInfo } from "./plugins/userMenu/userInfo";
import { AccountDetails } from "./plugins/userMenu/accountDetails";
import { SignOut } from "./plugins/userMenu/signOut";

const LoginScreen = createAuthentication();

const CognitoLoginScreen = () => LoginScreen;

export const Cognito = () => {
    return (
        <Fragment>
            <Compose component={LoginScreenRenderer} with={CognitoLoginScreen} />
            <Extensions>
                <HasPermission name={Permission.Users}>
                    <AddRoute exact path={"/admin-users"}>
                        <UIViewComponent view={new UsersView()} />
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
