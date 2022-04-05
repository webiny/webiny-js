import React from "react";
import { Route } from "@webiny/react-router";
import Helmet from "react-helmet";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import { SecureRoute } from "@webiny/app-security/components";
import { RoutePlugin } from "@webiny/app/types";
import { EditorPluginsLoader } from "../components/EditorPluginsLoader";

import Categories from "../views/Categories/Categories";
import Menus from "../views/Menus/Menus";
import Pages from "../views/Pages/Pages";
import Editor from "../views/Pages/Editor";

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
                    <SecureRoute permission={ROLE_PB_MENUS}>
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
                    <SecureRoute permission={ROLE_PB_PAGES}>
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
                render={({ location }) => {
                    return (
                        <SecureRoute permission={ROLE_PB_PAGES}>
                            <EditorPluginsLoader location={location}>
                                <Helmet title={"Page Builder - Edit page"} />
                                <Editor />
                            </EditorPluginsLoader>
                        </SecureRoute>
                    );
                }}
            />
        )
    }
];

export default plugins;
