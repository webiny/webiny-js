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
            <Menu label={t`User Management`} role={securityManageUsers}>
                <Menu label={t`Entities`} route="Entities.List" order={1} />
                <Menu label={t`Roles`} route="Roles.List" order={2} />
                <Menu label={t`Users`} route="Users.List" order={4} />
            </Menu>
        </Menu>
    );

    app.router.addRoute({
        name: "Users.Create",
        path: "/Users/new",
        component: () => import("./views/UsersForm").then(m => m.default),
        title: "Security - Create User",
        role: securityManageUsers
    });

    app.router.addRoute({
        name: "Users.Edit",
        path: "/users/:id",
        component: () => import("./views/UsersForm").then(m => m.default),
        title: "Security - Edit User",
        role: securityManageUsers
    });

    app.router.addRoute({
        name: "Users.List",
        path: "/users",
        component: () => import("./views/UsersList").then(m => m.default),
        title: "Security - Users",
        role: securityManageUsers
    });

    app.router.addRoute({
        name: "Roles.Create",
        path: "/roles/new",
        component: () => import("./views/RolesForm").then(m => m.default),
        title: "Security - Create Role",
        role: securityManageUsers
    });

    app.router.addRoute({
        name: "Roles.Edit",
        path: "/roles/:id",
        component: () => import("./views/RolesForm").then(m => m.default),
        title: "Security - Edit Role",
        role: securityManageUsers
    });

    app.router.addRoute({
        name: "Roles.List",
        path: "/roles",
        component: () => import("./views/RolesList").then(m => m.default),
        title: "Security - Roles",
        role: securityManageUsers
    });

    app.router.addRoute({
        name: "Entities.Create",
        path: "/entities/new",
        component: () => import("./views/EntitiesForm").then(m => m.default),
        title: "Security - Create Entity",
        role: securityManageUsers
    });

    app.router.addRoute({
        name: "Entities.Edit",
        path: "/entities/:id",
        component: () => import("./views/EntitiesForm").then(m => m.default),
        title: "Security - Edit Entity",
        role: securityManageUsers
    });

    app.router.addRoute({
        name: "Entities.List",
        path: "/entities",
        component: () => import("./views/EntitiesList").then(m => m.default),
        title: "Security - Entities",
        role: securityManageUsers
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
