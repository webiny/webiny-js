// @flow
import React from "react";
import AdminLayout from "webiny-admin/components/Layouts/AdminLayout";
import Categories from "webiny-app-cms/admin/views/Categories/Categories";
import Menus from "webiny-app-cms/admin/views/Menus/Menus";
import Pages from "webiny-app-cms/admin/views/Pages/Pages";
import Editor from "webiny-app-cms/admin/views/Pages/Editor";

export default [
    {
        name: "route-cms-categories",
        type: "route",
        route: {
            name: "Cms.Categories",
            path: "/cms/categories",
            render() {
                return (
                    <AdminLayout>
                        <Categories />
                    </AdminLayout>
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
                    <AdminLayout>
                        <Menus />
                    </AdminLayout>
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
                    <AdminLayout>
                        <Pages />
                    </AdminLayout>
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
                return <Editor />;
            }
        }
    }
];
