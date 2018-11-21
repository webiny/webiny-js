// @flow
import React from "react";
import "react-sortable-tree/style.css";
import { i18n } from "webiny-app/i18n";
import { addPlugin } from "webiny-app/plugins";
import AdminLayout from "webiny-app-admin/components/Layouts/AdminLayout";
import editorPlugins from "webiny-app-cms/editor/presets/default";
import renderPlugins from "webiny-app-cms/render/presets/default";
import { ReactComponent as PagesIcon } from "./assets/round-ballot-24px.svg";
import plugins from "./plugins";
import Categories from "./views/Categories/Categories";
import Menus from "./views/Menus/Menus";
import Pages from "./views/Pages/Pages";
import Editor from "./views/Pages/Editor";

const t = i18n.namespace("Cms.Admin.Menu");

export default () => {
    // CMS plugins
    addPlugin(...editorPlugins, ...renderPlugins, ...plugins);

    // Navigation plugin
    addPlugin({
        name: "cms-menu",
        type: "menu",
        render({ Menu }) {
            return (
                <Menu label={t`Content`} icon={<PagesIcon />}>
                    <Menu label={t`Pages`}>
                        <Menu label={t`Categories`} route="Cms.Categories" />
                        <Menu label={t`Pages`} route="Cms.Pages" />
                        <Menu label={t`Menus`} route="Cms.Menus" />
                    </Menu>
                </Menu>
            );
        }
    });

    addPlugin({
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
    });

    addPlugin({
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
    });

    addPlugin({
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
    });

    addPlugin({
        name: "route-cms-editor",
        type: "route",
        route: {
            name: "Cms.Editor",
            path: "/cms/editor/:id",
            render() {
                return <Editor />;
            }
        }
    });
};
