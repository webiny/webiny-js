import React from "react";
import { i18n } from "webiny-app";
import { Menu } from "webiny-app-admin";

const t = i18n.namespace("Admin.App");

const includeManager = app => {
    app.modules.register({
        name: "Security.SecurityToggleList",
        factory: () => import("./views/securityToggleList")
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
        component: () => import("./views/UsersForm").then(m => m.default),
        title: "Security - Create User",
        group: securityManageUsers
    });

    app.router.addRoute({
        name: "Users.Edit",
        path: "/users/:id",
        component: () => import("./views/UsersForm").then(m => m.default),
        title: "Security - Edit User",
        group: securityManageUsers
    });

    app.router.addRoute({
        name: "Users.List",
        path: "/users",
        component: () => import("./views/UsersList").then(m => m.default),
        title: "Security - Users",
        group: securityManageUsers
    });

    app.router.addRoute({
        name: "Groups.Create",
        path: "/groups/new",
        component: () => import("./views/GroupsForm").then(m => m.default),
        title: "Security - Create Group",
        group: securityManageUsers
    });

    app.router.addRoute({
        name: "Groups.Edit",
        path: "/groups/:id",
        component: () => import("./views/GroupsForm").then(m => m.default),
        title: "Security - Edit Group",
        group: securityManageUsers
    });

    app.router.addRoute({
        name: "Groups.List",
        path: "/groups",
        component: () => import("./views/GroupsList").then(m => m.default),
        title: "Security - Groups",
        group: securityManageUsers
    });

    app.router.addRoute({
        name: "Entities.List",
        path: "/entities",
        component: () => import("./views/EntitiesList").then(m => m.default),
        title: "Security - Entities",
        group: securityManageUsers
    });
};

export default (config = {}) => {
    return ({ app }, next) => {
        app.modules.register([
            {
                name: "Admin.UserMenu",
                factory: () => import("./components/UserMenu"),
                tags: ["header-component"]
            },
            {
                name: "Admin.Login",
                factory: () => import("./views/Login")
            },
            {
                name: "Admin.UserMenu.AccountPreferences",
                factory: () => import("./components/UserMenu/AccountPreferences"),
                tags: ["user-menu-item"]
            },
            {
                name: "Admin.UserMenu.Logout",
                factory: () => import("./components/UserMenu/Logout"),
                tags: ["user-logout-menu-item"]
            },
            {
                name: "Admin.UserAccountForm",
                factory: () => import("./components/UserAccount/UserAccountForm")
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

        if (config.manager) {
            includeManager(app);
        }

        next();
    };
};
