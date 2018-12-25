// @flow
import AdminLayout from "webiny-admin/components/Layouts/AdminLayout";
import React from "react";
const securityManager = "";
import Roles from "webiny-security/admin/views/Roles";
import Groups from "webiny-security/admin/views/Groups";
import ApiTokens from "webiny-security/admin/views/ApiTokens";
import Users from "webiny-security/admin/views/Users";
import Account from "webiny-security/admin/views/Account";

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
                    <AdminLayout>
                        <Roles />
                    </AdminLayout>
                );
            },
            group: securityManager
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
                    <AdminLayout>
                        <Groups />
                    </AdminLayout>
                );
            },
            group: securityManager
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
                    <AdminLayout>
                        <Users />
                    </AdminLayout>
                );
            },
            group: securityManager
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
                    <AdminLayout>
                        <ApiTokens />
                    </AdminLayout>
                );
            },
            group: securityManager
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
                    <AdminLayout>
                        <Account />
                    </AdminLayout>
                );
            },
            group: securityManager
        }
    }
];
