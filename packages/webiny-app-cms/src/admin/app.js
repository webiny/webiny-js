import React from "react";
import { i18n } from "webiny-app";
import { Menu } from "webiny-app-admin";
import CMS from "./services/CMS";
import PageList from "./views/pages/PageList";
import PageEditor from "./views/pages/PageEditor";
import CategoryList from "./views/categories/CategoryList";
import paragraphWidget from "./widgets/paragraph/index";
import imageWidget from "./widgets/image/index";

import paragraphPreviewWidget from "./../widgets/paragraph/index";
import imagePreviewWidget from "./../widgets/image/index";

const t = i18n.namespace("Cms.Admin.Menu");

export default () => {
    return ({ app }, next) => {
        app.services.register("cms", () => new CMS());

        app.modules.register({
           name: "EditorWidget",
           factory: () => import("./components/EditorWidget")
        });

        app.modules.register({
            name: "EditorWidgetSettings",
            factory: () => import("./components/EditorWidgetSettings")
        });

        const cmsService: CMS = app.services.get("cms");

        cmsService.addWidgetGroup({
            name: "text",
            title: "Text",
            icon: ["fa", "font"]
        });

        cmsService.addWidgetGroup({
            name: "media",
            title: "Media",
            icon: ["far", "image"]
        });

        // Editor widgets
        cmsService.addEditorWidget("text", paragraphWidget);
        cmsService.addEditorWidget("media", imageWidget);

        // Preview widgets
        cmsService.addWidget(paragraphPreviewWidget);
        cmsService.addWidget(imagePreviewWidget);

        app.services.get("menu").add(
            <Menu order="1" label={t`Content`} icon={["fas", "file-alt"]}>
                <Menu order={0} label={t`Pages`} route="Cms.Page.List" />
                <Menu order={1} label={t`Categories`} route="Cms.Category.List" />
                <Menu order={2} label={t`Menus`} route="Cms.Menu.List" />
                <Menu order={3} label={t`Redirects`} route="Cms.Redirect.List" />
            </Menu>
        );

        app.router.addRoute({
            name: "Cms.Page.List",
            path: "/cms/pages",
            exact: true,
            render: () => {
                return app.modules.load({ Layout: "Admin.Layout" }).then(({ Layout }) => {
                    return (
                        <Layout>
                            <PageList />
                        </Layout>
                    );
                });
            }
        });

        app.router.addRoute({
            name: "Cms.Page.Create",
            path: "/cms/pages/editor",
            exact: true,
            render: () => {
                return app.modules.load({ Layout: "Admin.Layout" }).then(({ Layout }) => {
                    return (
                        <Layout>
                            <PageEditor />
                        </Layout>
                    );
                });
            }
        });

        app.router.addRoute({
            name: "Cms.Category.List",
            path: "/cms/categories",
            exact: true,
            render: () => {
                return app.modules.load({ Layout: "Admin.Layout" }).then(({ Layout }) => {
                    return (
                        <Layout>
                            <CategoryList />
                        </Layout>
                    );
                });
            }
        });

        next();
    };
};
