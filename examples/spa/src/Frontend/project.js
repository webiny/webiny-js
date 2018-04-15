import React from "react";
import { i18n } from "webiny-app";
import { Menu } from "webiny-app-admin";

const t = i18n.namespace("NewClient.Frontend");

export default () => {
    return async (params, next) => {
        const { app } = params;

        app.services.get("menu").add(
            <Menu order="0" label={t`Dashboard`} icon="home">
                <Menu order="0" label={t`My Account`} route="Homepage" />
                <Menu order="1" label={t`Settings`} route="Homepage" />
            </Menu>
        );

        app.router.addRoute({
            name: "Contact",
            path: "/contact/:id",
            component: () => import("./views/Contact").then(m => m.default)
        });

        app.router.addRoute({
            name: "Profile",
            path: "/about/:id",
            component: () => import("./views/Profile").then(m => m.default)
        });

        app.router.addRoute({
            name: "Dashboard",
            path: "/about",
            render() {
                return import("./views/About").then(m => {
                    return React.createElement(m.default);
                });
            }
        });

        app.router.addRoute({
            name: "Homepage",
            exact: true,
            path: "/",
            render() {
                return (
                    <div>
                        <h1>{t`Homepage`}</h1>
                        <a href={"/about"}>{t`About`}</a>
                    </div>
                );
            }
        });

        app.router.addRoute({
            name: "NotMatched",
            path: "*",
            render() {
                return (
                    <div>
                        <h1>{t`404 Not Found`}</h1>
                        <a href={"/"}>{t`Get me out of here`}</a>
                    </div>
                );
            }
        });

        next();
    };
};
