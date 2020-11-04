import React, { Suspense, lazy } from "react";
import { Route } from "@webiny/react-router";
import Helmet from "react-helmet";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import { SecureRoute } from "@webiny/app-security/components";
import { RoutePlugin } from "@webiny/app/types";
import { CircularProgress } from "@webiny/ui/Progress";
import { EditorPluginsLoader } from "../components/EditorPluginsLoader";

const Loader = ({ children, ...props }) => (
    <Suspense fallback={<CircularProgress />}>{React.cloneElement(children, props)}</Suspense>
);

const Categories = lazy(() => import("@webiny/app-page-builder/admin/views/Categories/Categories"));
const Menus = lazy(() => import("@webiny/app-page-builder/admin/views/Menus/Menus"));
const Pages = lazy(() => import("@webiny/app-page-builder/admin/views/Pages/Pages"));
const Editor = lazy(() => import("@webiny/app-page-builder/admin/views/Pages/Editor"));

const ROLE_PB_CATEGORY = "pb.category";
const ROLE_PB_MENUS = "pb.menu";
const ROLE_PB_PAGES = "pb.page";

const plugins: RoutePlugin[] = [
    {
        name: "route-pb-categories",
        type: "route",
        route: (
            <Route
                exact
                path="/page-builder/categories"
                render={() => (
                    <SecureRoute permission={ROLE_PB_CATEGORY}>
                        <AdminLayout>
                            <Helmet title={"Page Builder - Categories"} />
                            <Loader>
                                <Categories />
                            </Loader>
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
                    <SecureRoute permission={ROLE_PB_MENUS}>
                        <AdminLayout>
                            <Helmet title={"Page Builder - Menus"} />
                            <Loader>
                                <Menus />
                            </Loader>
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
                    <SecureRoute permission={ROLE_PB_PAGES}>
                        <EditorPluginsLoader location={location}>
                            <AdminLayout>
                                <Helmet title={"Page Builder - Pages"} />
                                <Loader>
                                    <Pages />
                                </Loader>
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
                    <SecureRoute permission={ROLE_PB_PAGES}>
                        <EditorPluginsLoader location={location}>
                            <Helmet title={"Page Builder - Edit page"} />
                            <Loader>
                                <Editor />
                            </Loader>
                        </EditorPluginsLoader>
                    </SecureRoute>
                )}
            />
        )
    }
];

export default plugins;
