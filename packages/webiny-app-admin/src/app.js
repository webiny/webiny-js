// @flow
import React from "react";
import { i18n } from "webiny-app/i18n";
import { router } from "webiny-app/router";
import { addPlugin } from "webiny-app/plugins";
import "./actions";
import plugins from "webiny-app-admin/presets/default";
import { ReactComponent as SecurityIcon } from "./assets/images/icons/baseline-security-24px.svg";
import Login from "./views/Login";
import Policies from "./views/Policies";
import ApiTokens from "./views/ApiTokens";
import Users from "./views/Users";
import Groups from "./views/Groups";
import Account from "./views/Account";
import AdminLayout from "webiny-app-admin/components/Layouts/AdminLayout";

const t = i18n.namespace("Admin.App");
const securityManager = "webiny-security-manager";

export default () => {
    return (params: Object, next: Function) => {
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

        // Add routes
        router.addRoute({
            name: "Login",
            path: "/login",
            exact: true,
            title: "Login",
            render() {
                return (
                    <Login
                        identity={"SecurityUser"}
                        strategy={"credentials"}
                        onSuccess={() => router.goToRoute({ name: router.config.defaultRoute })}
                    />
                );
            }
        });

        router.addRoute({
            name: "Policies",
            path: "/policies",
            title: "Security - Policies",
            render() {
                return (
                    <AdminLayout>
                        <Policies />
                    </AdminLayout>
                );
            },
            group: securityManager
        });
        router.addRoute({
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
        });

        router.addRoute({
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
        });

        router.addRoute({
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
        });

        router.addRoute({
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
        });

        next();
    };
};
