// @flow
import React from "react";
import { i18n } from "webiny-app/i18n";
import { addPlugin } from "webiny-app/plugins";
import AdminLayout from "webiny-app-admin/components/Layouts/AdminLayout";
//import editorPlugins from "webiny-app-cms/editor/presets/default";
//import renderPlugins from "webiny-app-cms/render/presets/default";
import { ReactComponent as PagesIcon } from "./assets/round-ballot-24px.svg";
import plugins from "./plugins";
import Categories from "./views/Categories/Categories";
//import Pages from "./views/Pages/Pages";
//import Editor from "./views/Pages/Editor";

const t = i18n.namespace("Cms.Admin.Menu");

export default () => {
    // CMS plugins
    //addPlugin(...editorPlugins, ...renderPlugins);

    // Navigation plugin
    addPlugin({
        name: "cms-menu",
        type: "menu",
        render({ Menu }) {
            return (
                <Menu label={t`Content`} icon={<PagesIcon />}>
                    <Menu label={t`Pages`}>
                        <Menu label={t`Categories`} route="Cms.Categories" />
                        {/*<Menu label={t`Pages`} route="Cms.Pages" />*/}
                        {/*<Menu label={t`Menus`} route="Cms.Menus.List" />*/}
                    </Menu>
                </Menu>
            );
        }
    });

    addPlugin(...plugins);

    addPlugin({
        name: "route-cms-categories",
        type: "route",
        route: {
            name: "Cms.Categories",
            path: "/cms/categories",
            exact: true,
            render() {
                return (
                    <AdminLayout>
                        <Categories />
                    </AdminLayout>
                );
            }
        }
    });

    /*addPlugin({
        name: "route-cms-pages",
        type: "route",
        route: {
            name: "Cms.Pages",
            path: "/cms/pages",
            exact: true,
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
            path: "/cms/editor/:page/:revision",
            exact: true,
            render() {
                return <Editor />;
            }
        }
    });*/
};
