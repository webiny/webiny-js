// @flow
import React, { Suspense, lazy } from "react";
import { Route } from "react-router-dom";
import Helmet from "react-helmet";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import { SecureRoute } from "@webiny/app-security/components";
import { CircularProgress } from "@webiny/ui/Progress";
import { EditorPluginsLoader } from "../components/EditorPluginsLoader";

const Loader = ({ children, ...props }) => (
    <Suspense fallback={<CircularProgress />}>
        {React.cloneElement(children, props)}
    </Suspense>
);

const Categories = lazy(() =>import("@webiny/app-page-builder/admin/views/Categories/Categories"));
const Menus = lazy(() => import("@webiny/app-page-builder/admin/views/Menus/Menus"));
const Pages = lazy(() => import("@webiny/app-page-builder/admin/views/Pages/Pages"));
const Editor = lazy(() => import("@webiny/app-page-builder/admin/views/Pages/Editor"));

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
                            <Loader><Categories/></Loader>
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
                            <Loader><Menus/></Loader>
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
                                <Loader><Pages/></Loader>
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
                            <Loader><Editor/></Loader>
                        </EditorPluginsLoader>
                    </SecureRoute>
                )}
            />
        )
    }
];
