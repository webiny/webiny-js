import React from "react";
import { i18n } from "webiny-app";
import { Menu } from "webiny-app-admin";
import CMS from "./services/CMS";
import PageManagerContainer from "./views/pages/PageManagerContainer";
import PageEditor from "./views/pages/PageEditor";
import CategoryList from "./views/categories/CategoryList";
import registerWidgets from "./registerWidgets";

const t = i18n.namespace("Cms.Admin.Menu");

export default () => {
    return ({ app }, next) => {
        app.services.register("cms", () => new CMS());

        registerWidgets();

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
                return app.modules.load([{ Layout: "Admin.Layout" }]).then(({ Layout }) => {
                    return (
                        <Layout>
                            <PageManagerContainer />
                        </Layout>
                    );
                });
            }
        });

        app.router.addRoute({
            name: "Cms.Page.Editor",
            path: "/cms/pages/revision/:id",
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
