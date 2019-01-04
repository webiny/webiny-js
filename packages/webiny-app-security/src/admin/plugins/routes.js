// @flow
import AdminLayout from "webiny-admin/components/Layouts/AdminLayout";
import React from "react";
import Roles from "webiny-app-security/admin/views/Roles";
import Groups from "webiny-app-security/admin/views/Groups";
import ApiTokens from "webiny-app-security/admin/views/ApiTokens";
import Users from "webiny-app-security/admin/views/Users";
import Account from "webiny-app-security/admin/views/Account";
import { SecureRoute } from "webiny-app-security/components";
import {
    SCOPES_API_TOKENS,
    SCOPES_GROUPS,
    SCOPES_ROLES,
    SCOPES_USERS
} from "webiny-app-security/admin";

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
                            <Users />
                        </AdminLayout>
                    </SecureRoute>
                );
            }
        }
    },
    {
        name: "route-api-tokens",
        type: "route",
        route: {
            name: "ApiTokens",
            path: "/api-tokens",
            title: "Security - Identities - API Tokens",
            render() {
                return (
                    <SecureRoute scopes={SCOPES_API_TOKENS}>
                        <AdminLayout>
                            <ApiTokens />
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
                            <Account />
                        </AdminLayout>
                    </SecureRoute>
                );
            }
        }
    }
];
