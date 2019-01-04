// @flow
import AdminLayout from "webiny-admin/components/Layouts/AdminLayout";
import React from "react";
import Roles from "webiny-app-security/admin/views/Roles";
import Groups from "webiny-app-security/admin/views/Groups";
import Users from "webiny-app-security/admin/views/Users";
import Account from "webiny-app-security/admin/views/Account";
import { SecureRoute } from "webiny-app-security/components";
import { SCOPES_GROUPS, SCOPES_ROLES, SCOPES_USERS } from "webiny-app-security/admin";
import Helmet from "react-helmet";

export default [
    {
        name: "route-roles",
        type: "route",
        route: {
            name: "Roles",
            path: "/roles",
            title: "Security - Roles",
            render() {
                return (
                    <SecureRoute scopes={SCOPES_ROLES}>
                        <AdminLayout>
                            <Helmet>
                                <title>Security - Roles</title>
                            </Helmet>
                            <Roles />
                        </AdminLayout>
                    </SecureRoute>
                );
            }
        }
    },
    {
        name: "route-groups",
        type: "route",
        route: {
            name: "Groups",
            path: "/groups",
            title: "Security - Groups",
            render() {
                return (
                    <SecureRoute scopes={SCOPES_GROUPS}>
                        <AdminLayout>
                            <Helmet>
                                <title>Security - Groups</title>
                            </Helmet>
                            <Groups />
                        </AdminLayout>
                    </SecureRoute>
                );
            }
        }
    },
    {
        name: "route-users",
        type: "route",
        route: {
            name: "Users",
            path: "/users",
            title: "Security - Users",
            render() {
                return (
                    <SecureRoute scopes={SCOPES_USERS}>
                        <AdminLayout>
                            <Helmet>
                                <title>Security - Users</title>
                            </Helmet>
                            <Users />
                        </AdminLayout>
                    </SecureRoute>
                );
            }
        }
    },
    {
        name: "route-account",
        type: "route",
        route: {
            name: "Account",
            path: "/account",
            title: "Account",
            render() {
                return (
                    <SecureRoute>
                        <AdminLayout>
                            <Helmet>
                                <title>CMS - Categories</title>
                            </Helmet>
                            <Account />
                        </AdminLayout>
                    </SecureRoute>
                );
            }
        }
    }
];
