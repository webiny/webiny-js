// @flow
import React from "react";
import { router } from "webiny-app/router";
import { i18n } from "webiny-app/i18n";
import { addPlugin } from "webiny-app/plugins";
import AdminLayout from "webiny-app-admin/components/Layouts/AdminLayout";
import { Editor as CmsEditor } from "webiny-app-cms/editor";
import editorPlugins from "webiny-app-cms/editor/presets/default";
import renderPlugins from "webiny-app-cms/render/presets/default";
import { ReactComponent as PagesIcon } from "./assets/round-ballot-24px.svg";
import plugins from "./plugins";
import Categories from "./views/Categories/Categories";

const t = i18n.namespace("Cms.Admin.Menu");

export default () => {
    return (params: Object, next: Function) => {
        // CMS plugins
        addPlugin(...editorPlugins, ...renderPlugins);

        // Navigation plugin
        addPlugin({
            name: "cms-menu",
            type: "menu",
            render({ Menu }) {
                return (
                    <Menu label={t`Content`} icon={<PagesIcon />}>
                        <Menu label={t`Pages`}>
                            <Menu label={t`Editor`} route="Cms.Editor" />
                            <Menu label={t`Categories`} route="Cms.Categories" />
                            {/*<Menu label={t`Menus`} route="Cms.Menus.List" />*/}
                        </Menu>
                    </Menu>
                );
            }
        });

        addPlugin(...plugins);

        router.addRoute({
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
        });

        router.addRoute({
            name: "Cms.Editor",
            path: "/cms/editor",
            exact: true,
            render() {
                return (
                    <CmsEditor/>
                );
            }
        });

        /*
        router.addRoute({
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
        });
        */

        next();
    };
};
