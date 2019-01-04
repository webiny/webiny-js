// @flow
import React from "react";
import AdminLayout from "webiny-admin/components/Layouts/AdminLayout";
import Categories from "webiny-app-cms/admin/views/Categories/Categories";
import Menus from "webiny-app-cms/admin/views/Menus/Menus";
import Pages from "webiny-app-cms/admin/views/Pages/Pages";
import Editor from "webiny-app-cms/admin/views/Pages/Editor";
import { SecureRoute } from "webiny-app-security/components";
import { SCOPES_PAGES, SCOPES_CATEGORIES, SCOPES_MENUS } from "webiny-app-cms";

export default [
    {
        name: "route-cms-categories",
        type: "route",
        route: {
            name: "Cms.Categories",
            path: "/cms/categories",
            render() {
                return (
                    <SecureRoute scopes={SCOPES_CATEGORIES}>
                        <AdminLayout>
                            <Categories />
                        </AdminLayout>
                    </SecureRoute>
                );
            }
        }
    },
    {
        name: "route-cms-menus",
        type: "route",
        route: {
            name: "Cms.Menus",
            path: "/cms/menus",
            exact: true,
            render() {
                return (
                    <SecureRoute scopes={SCOPES_MENUS}>
                        <AdminLayout>
                            <Menus />
                        </AdminLayout>
                    </SecureRoute>
                );
            }
        }
    },
    {
        name: "route-cms-pages",
        type: "route",
        route: {
            name: "Cms.Pages",
            path: "/cms/pages",
            render() {
                return (
                    <SecureRoute scopes={SCOPES_PAGES}>
                        <AdminLayout>
                            <Pages />
                        </AdminLayout>
                    </SecureRoute>
                );
            }
        }
    },
    {
        name: "route-cms-editor",
        type: "route",
        route: {
            name: "Cms.Editor",
            path: "/cms/editor/:id",
            render() {
                return (
                    <SecureRoute scopes={SCOPES_PAGES}>
                        <Editor />
                    </SecureRoute>
                );
            }
        }
    }
];
