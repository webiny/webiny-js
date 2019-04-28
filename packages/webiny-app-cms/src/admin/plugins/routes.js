// @flow
import React from "react";
import { Route } from "react-router-dom";
import Helmet from "react-helmet";
import Loadable from "react-loadable";
import { AdminLayout } from "webiny-admin/components/AdminLayout";
import { SecureRoute } from "webiny-app-security/components";
import { CircularProgress } from "webiny-ui/Progress";
import EditorPluginsLoader from "../components/EditorPluginsLoader";

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
        route: (
            <Route
                exact
                path="/cms/categories"
                render={() => (
                    <SecureRoute roles={["cms-categories"]}>
                        <AdminLayout>
                            <Helmet title={"CMS - Categories"} />
                            <Categories />
                        </AdminLayout>
                    </SecureRoute>
                )}
            />
        )
    },
    {
        name: "route-cms-menus",
        type: "route",
        route: (
            <Route
                exact
                path="/cms/menus"
                render={() => (
                    <SecureRoute roles={["cms-menus"]}>
                        <AdminLayout>
                            <Helmet title={"CMS - Menus"} />
                            <Menus />
                        </AdminLayout>
                    </SecureRoute>
                )}
            />
        )
    },
    {
        name: "route-cms-pages",
        type: "route",
        route: (
            <Route
                exact
                path="/cms/pages"
                render={({ location }) => (
                    <SecureRoute roles={["cms-editor"]}>
                        <EditorPluginsLoader location={location}>
                            <AdminLayout>
                                <Helmet title={"CMS - Pages"} />
                                <Pages />
                            </AdminLayout>
                        </EditorPluginsLoader>
                    </SecureRoute>
                )}
            />
        )
    },
    {
        name: "route-cms-editor",
        type: "route",
        route: (
            <Route
                exact
                path="/cms/editor/:id"
                render={({ location }) => (
                    <SecureRoute roles={["cms-editor"]}>
                        <EditorPluginsLoader location={location}>
                            <Helmet title={"CMS - Edit page"} />
                            <Editor />
                        </EditorPluginsLoader>
                    </SecureRoute>
                )}
            />
        )
    }
];
