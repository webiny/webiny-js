// @flow
import React from "react";
import { i18n } from "webiny-app/i18n";
import { addPlugin } from "webiny-app/plugins";
import plugins from "webiny-app-admin/presets/default";
import { ReactComponent as SecurityIcon } from "./assets/images/icons/baseline-security-24px.svg";
//import Login from "./views/Login";
import Roles from "./views/Roles";
import Users from "./views/Users";
import ApiTokens from "./views/ApiTokens";
//import Groups from "./views/Groups";
//import Account from "./views/Account";
import AdminLayout from "webiny-app-admin/components/Layouts/AdminLayout";

const t = i18n.namespace("Admin.App");
const securityManager = "webiny-security-manager";

export default () => {
    addPlugin(...plugins);

    // Add menu plugin
    addPlugin({
        name: "security-menu",
        type: "menu",
        render({ Menu }) {
            return (
                <Menu label={t`Security`} icon={<SecurityIcon />}>
                    <Menu label={t`Identities`} group={securityManager}>
                        <Menu label={t`Users`} route="Users" />
                        <Menu label={t`API Tokens`} route="ApiTokens" />
                    </Menu>
                    <Menu label={t`User Management`} group={securityManager}>
                        <Menu label={t`Groups`} route="Groups" />
                        <Menu label={t`Policies`} route="Policies" />
                    </Menu>
                </Menu>
            );
        }
    });

    addPlugin({
        name: "route-roles",
        type: "route",
        route: {
            name: "Roles",
            path: "/roles",
            title: "Security - Roles",
            render() {
                return (
                    <AdminLayout>
                        <Roles/>
                    </AdminLayout>
                );
            },
            group: securityManager
        }
    });/*

    addPlugin({
        name: "route-groups",
        type: "route",
        route: {
            name: "Groups",
            path: "/groups",
            title: "Security - Groups",
            render() {
                return (
                    <AdminLayout>
                        <Groups />
                    </AdminLayout>
                );
            },
            group: securityManager
        }
    });*/

    addPlugin({
        name: "route-users",
        type: "route",
        route: {
            name: "Users",
            path: "/users",
            title: "Security - Users",
            render() {
                return (
                    <AdminLayout>
                        <Users />
                    </AdminLayout>
                );
            },
            user: securityManager
        }
    });

    addPlugin({
        name: "route-api-tokens",
        type: "route",
        route: {
            name: "ApiTokens",
            path: "/identities/api-tokens",
            title: "Security - Identities - API Tokens",
            render() {
                return (
                    <AdminLayout>
                        <ApiTokens />
                    </AdminLayout>
                );
            },
            group: securityManager
        }
    });

    /*addPlugin({
        name: "route-account",
        type: "route",
        route: {
            name: "Account",
            path: "/account",
            title: "Account",
            render() {
                return (
                    <AdminLayout>
                        <Account />
                    </AdminLayout>
                );
            },
            group: securityManager
        }
    });*/
};
