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
    loader: () => import("webiny-app-page-builder/admin/views/Categories/Categories"),
    loading: CircularProgress
});

const Menus = Loadable({
    loader: () => import("webiny-app-page-builder/admin/views/Menus/Menus"),
    loading: CircularProgress
});

const Pages = Loadable({
    loader: () => import("webiny-app-page-builder/admin/views/Pages/Pages"),
    loading: CircularProgress
});

const Editor = Loadable({
    loader: () => import("webiny-app-page-builder/admin/views/Pages/Editor"),
    loading: CircularProgress
});

export default [
    {
        name: "route-pb-categories",
        type: "route",
        route: (
            <Route
                exact
                path="/page-builder/categories"
                render={() => (
                    <SecureRoute roles={["pb-categories"]}>
                        <AdminLayout>
                            <Helmet title={"Page Builder - Categories"} />
                            <Categories />
                        </AdminLayout>
                    </SecureRoute>
                )}
            />
        )
    },
    {
        name: "route-pb-menus",
        type: "route",
        route: (
            <Route
                exact
                path="/page-builder/menus"
                render={() => (
                    <SecureRoute roles={["pb-menus"]}>
                        <AdminLayout>
                            <Helmet title={"Page Builder - Menus"} />
                            <Menus />
                        </AdminLayout>
                    </SecureRoute>
                )}
            />
        )
    },
    {
        name: "route-pb-pages",
        type: "route",
        route: (
            <Route
                exact
                path="/page-builder/pages"
                render={({ location }) => (
                    <SecureRoute roles={["pb-editor"]}>
                        <EditorPluginsLoader location={location}>
                            <AdminLayout>
                                <Helmet title={"Page Builder - Pages"} />
                                <Pages />
                            </AdminLayout>
                        </EditorPluginsLoader>
                    </SecureRoute>
                )}
            />
        )
    },
    {
        name: "route-pb-editor",
        type: "route",
        route: (
            <Route
                exact
                path="/page-builder/editor/:id"
                render={({ location }) => (
                    <SecureRoute roles={["pb-editor"]}>
                        <EditorPluginsLoader location={location}>
                            <Helmet title={"Page Builder - Edit page"} />
                            <Editor />
                        </EditorPluginsLoader>
                    </SecureRoute>
                )}
            />
        )
    }
];
