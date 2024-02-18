import React, { Fragment, memo } from "react";
import {
    Compose,
    Plugin,
    LoginScreenRenderer,
    AddMenu as Menu,
    AddUserMenuItem,
    AddRoute,
    Layout,
    Decorator,
    GenericComponent
} from "@webiny/app-admin";
import { plugins } from "@webiny/plugins";
import { HasPermission } from "@webiny/app-security";
import { Permission } from "~/plugins/constants";
import { createAuthentication, CreateAuthenticationConfig } from "~/createAuthentication";
import { UsersView } from "~/ui/views/Users/UsersView";
import { Account } from "~/ui/views/Account";
import { UserInfo } from "./plugins/userMenu/userInfo";
import { AccountDetails } from "./plugins/userMenu/accountDetails";
import { SignOut } from "./plugins/userMenu/signOut";

import installation from "./plugins/installation";
import permissionRenderer from "./plugins/permissionRenderer";
import cognito from "./plugins/cognito";

const createLoginScreenDecorator = (
    config?: CreateAuthenticationConfig
): Decorator<GenericComponent> => {
    return () => createAuthentication(config);
};

export interface CognitoProps {
    config?: CreateAuthenticationConfig;
}

const CognitoIdP = (props: CognitoProps) => {
    plugins.register([installation, permissionRenderer, cognito()]);

    return (
        <Fragment>
            <Compose
                component={LoginScreenRenderer}
                with={createLoginScreenDecorator(props.config)}
            />
            <Plugin>
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
            </Plugin>
        </Fragment>
    );
};

export const Cognito = memo(CognitoIdP);
