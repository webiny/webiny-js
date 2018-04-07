import React from "react";
import { i18n } from "webiny-app";
import { Menu } from "webiny-app-admin";

const t = i18n.namespace("Admin.App");

export default () => {
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
            name: "Me.Account",
            path: "/me/account",
            component: () => app.modules.load("Admin.UserAccountForm"),
            title: "My Account"
        });

        app.modules.register([
            {
                name: "Security.SecurityToggleList",
                factory: () => import("./views/securityToggleList")
            }
        ]);

        const securityManageUsers = "webiny-security-manager";

        app.services.get("menu").add(
            <Menu label={t`Security`} icon="icon-users">
                <Menu label={t`User Management`} role={securityManageUsers}>
                    <Menu label={t`Permissions`} route="Permissions.List" order={1} />
                    <Menu label={t`Roles`} route="Roles.List" order={2} />
                    <Menu label={t`Role Groups`} route="RoleGroups.List" order={3} />
                    <Menu label={t`Users`} route="Users.List" order={4} />
                </Menu>
            </Menu>
        );

        app.router.addRoute({
            name: "Users.Create",
            path: "/views/Users/new",
            component: () => import("./views/UsersForm").then(m => m.default),
            title: "Security - Create User",
            role: securityManageUsers
        });

        app.router.addRoute({
            name: "Users.Edit",
            path: "/views/users/:id",
            component: () => import("./views/UsersForm").then(m => m.default),
            title: "Security - Edit User",
            role: securityManageUsers
        });

        app.router.addRoute({
            name: "Users.List",
            path: "/views/users",
            component: () => import("./views/UsersList").then(m => m.default),
            title: "Security - Users",
            role: securityManageUsers
        });

        app.router.addRoute({
            name: "Roles.Create",
            path: "/views/roles/new",
            component: () => import("./views/RolesForm").then(m => m.default),
            title: "Security - Create Role",
            role: securityManageUsers
        });

        app.router.addRoute({
            name: "Roles.Edit",
            path: "/views/roles/:id",
            component: () => import("./views/RolesForm").then(m => m.default),
            title: "Security - Edit Role",
            role: securityManageUsers
        });

        app.router.addRoute({
            name: "Roles.List",
            path: "/views/roles",
            component: () => import("./views/RolesList").then(m => m.default),
            title: "Security - Roles",
            role: securityManageUsers
        });

        app.router.addRoute({
            name: "RoleGroups.Create",
            path: "/views/role-groups/new",
            component: () => import("./views/RoleGroupsForm").then(m => m.default),
            title: "Security - Create Role Group",
            role: securityManageUsers
        });

        app.router.addRoute({
            name: "RoleGroups.Edit",
            path: "/views/role-groups/:id",
            component: () => import("./views/RoleGroupsForm").then(m => m.default),
            title: "Security - Edit Role Group",
            role: securityManageUsers
        });

        app.router.addRoute({
            name: "RoleGroups.List",
            path: "/views/role-groups",
            component: () => import("./views/RoleGroupsList").then(m => m.default),
            title: "Security - Role Groups",
            role: securityManageUsers
        });

        app.router.addRoute({
            name: "Permissions.Create",
            path: "/views/permissions/new",
            component: () => import("./views/PermissionsForm").then(m => m.default),
            title: "Security - Create Permission",
            role: securityManageUsers
        });

        app.router.addRoute({
            name: "Permissions.Edit",
            path: "/views/permissions/:id",
            component: () => import("./views/PermissionsForm").then(m => m.default),
            title: "Security - Edit Permission",
            role: securityManageUsers
        });

        app.router.addRoute({
            name: "Permissions.List",
            path: "/views/permissions",
            component: () => import("./views/PermissionsList").then(m => m.default),
            title: "Security - Permissions",
            role: securityManageUsers
        });

        app.router.addRoute({
            name: "NotMatched",
            path: "*",
            render() {
                return (
                    <div>
                        <h1>{t`404 Not Found`}</h1>
                        <a href={"/"}>{t`Get me out of here`}</a>
                    </div>
                );
            }
        });

        next();
    };
};
