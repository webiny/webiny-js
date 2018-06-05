import { app } from "webiny-app";
import { app as uiApp } from "webiny-app-ui";
import MenuService from "./services/Menu";
import Menu from "./components/Menu";
import { i18n } from "webiny-app";
import React from "react";

const t = i18n.namespace("Admin.App");

export default () => {
    return (params, next) => {
        Promise.all([new Promise(res => uiApp()(params, res))]).then(() => {
            app.services.register("menu", () => new MenuService());

            app.modules.register([
                {
                    name: "Admin.Layout",
                    factory: () => import("./components/Layouts/AdminLayout")
                },
                {
                    name: "Admin.EmptyLayout",
                    factory: () => import("./components/Layouts/EmptyLayout")
                },
                {
                    name: "Admin.Header",
                    factory: () => import("./components/Header")
                },
                {
                    name: "Admin.Footer",
                    factory: () => import("./components/Footer")
                },
                {
                    name: "Admin.Logo",
                    factory: () => import("./components/Logo"),
                    tags: ["header-component"]
                },
                {
                    name: "Admin.Navigation",
                    factory: () => import("./components/Navigation")
                },
                {
                    name: "Admin.Navigation.Desktop",
                    factory: () => import("./components/Navigation/Desktop")
                },
                {
                    name: "Admin.Navigation.Mobile",
                    factory: () => import("./components/Navigation/Mobile")
                }
            ]);

            app.modules.register([
                {
                    name: "Admin.UserMenu",
                    factory: () => import("./admin/components/UserMenu"),
                    tags: ["header-component"]
                },
                {
                    name: "Admin.Login",
                    factory: () => import("./admin/views/Login")
                },
                {
                    name: "Admin.UserMenu.AccountPreferences",
                    factory: () => import("./admin/components/UserMenu/AccountPreferences"),
                    tags: ["user-menu-item"]
                },
                {
                    name: "Admin.UserMenu.Logout",
                    factory: () => import("./admin/components/UserMenu/Logout"),
                    tags: ["user-logout-menu-item"]
                },
                {
                    name: "Admin.UserAccountForm",
                    factory: () => import("./admin/components/UserAccount/UserAccountForm")
                }
            ]);

            app.router.addRoute({
                name: "Login",
                path: "/login",
                exact: true,
                render: () =>
                    app.modules.load("Admin.Login").then(Login => {
                        return (
                            <Login
                                identity={"SecurityUser"}
                                strategy={"credentials"}
                                onSuccess={() => {
                                    app.router.goToRoute("Dashboard");
                                }}
                            />
                        );
                    }),
                title: "Login"
            });

            app.router.addRoute({
                name: "Me.Account",
                path: "/me",
                render: () =>
                    app.modules.load("Admin.UserAccountForm").then(AccountForm => {
                        return <AccountForm />;
                    }),
                title: "My Account"
            });

            // Security management module.
            app.modules.register({
                name: "Security.SecurityToggleList",
                factory: () => import("./admin/views/SecurityToggleList")
            });

            const securityManageUsers = "webiny-security-manager";

            app.services.get("menu").add(
                <Menu label={t`Security`} icon="user-secret">
                    <Menu label={t`User Management`} group={securityManageUsers}>
                        <Menu label={t`Entities`} route="Entities.List" order={1} />
                        <Menu label={t`Groups`} route="Groups.List" order={2} />
                        <Menu label={t`Users`} route="Users.List" order={4} />
                    </Menu>
                </Menu>
            );

            app.router.addRoute({
                name: "Users.Create",
                path: "/Users/new",
                component: () => import("./admin/views/UsersForm").then(m => m.default),
                title: "Security - Create User",
                group: securityManageUsers
            });

            app.router.addRoute({
                name: "Users.Edit",
                path: "/users/:id",
                component: () => import("./admin/views/UsersForm").then(m => m.default),
                title: "Security - Edit User",
                group: securityManageUsers
            });

            app.router.addRoute({
                name: "Users.List",
                path: "/users",
                component: () => import("./admin/views/UsersList").then(m => m.default),
                title: "Security - Users",
                group: securityManageUsers
            });

            app.router.addRoute({
                name: "Groups.Create",
                path: "/groups/new",
                component: () => import("./admin/views/GroupsForm").then(m => m.default),
                title: "Security - Create Group",
                group: securityManageUsers
            });

            app.router.addRoute({
                name: "Groups.Edit",
                path: "/groups/:id",
                component: () => import("./admin/views/GroupsForm").then(m => m.default),
                title: "Security - Edit Group",
                group: securityManageUsers
            });

            app.router.addRoute({
                name: "Groups.List",
                path: "/groups",
                component: () => import("./admin/views/GroupsList").then(m => m.default),
                title: "Security - Groups",
                group: securityManageUsers
            });

            app.router.addRoute({
                name: "Entities.List",
                path: "/entities",
                component: () => import("./admin/views/EntitiesList").then(m => m.default),
                title: "Security - Entities",
                group: securityManageUsers
            });

            next();
        });
    };
};
