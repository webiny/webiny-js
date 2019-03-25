// @flow
import React from "react";
import Helmet from "react-helmet";
import Loadable from "react-loadable";
import { AdminLayout } from "webiny-admin/components/AdminLayout";
import { SecureRoute } from "webiny-app-security/components";
import { CircularProgress } from "webiny-ui/Progress";

const Categories = Loadable({
    loader: () => import("webiny-app-cms/admin/views/Categories/Categories"),
    loading: CircularProgress
});

const Menus = Loadable({
    loader: () => import("webiny-app-cms/admin/views/Menus/Menus"),
    loading: CircularProgress
});

const Pages = Loadable({
    loader: () => import("webiny-app-cms/admin/views/Pages/Pages"),
    loading: CircularProgress
});

const Editor = Loadable({
    loader: () => import("webiny-app-cms/admin/views/Pages/Editor"),
    loading: CircularProgress
});

export default [
    {
        name: "route-cms-categories",
        type: "route",
        route: {
            name: "Cms.Categories",
            path: "/cms/categories",
            render() {
                return (
                    <SecureRoute roles={["cms-categories"]}>
                        <Helmet>
                            <title>CMS - Categories</title>
                        </Helmet>
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
                    <SecureRoute roles={["cms-menus"]}>
                        <Helmet>
                            <title>CMS - Menus</title>
                        </Helmet>
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
                    <SecureRoute roles={["cms-editor"]}>
                        <Helmet>
                            <title>CMS - Pages</title>
                        </Helmet>
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
                    <SecureRoute roles={["cms-editor"]}>
                        <Helmet>
                            <title>CMS - Edit page</title>
                        </Helmet>
                        <Editor />
                    </SecureRoute>
                );
            }
        }
    }
];