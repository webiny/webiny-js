import React from "react";
import { i18n } from "webiny-client";
import { Menu } from "webiny-skeleton-app";

const t = i18n.namespace("NewClient.Frontend");

export default () => {
    return async (params, next) => {
        const { app } = params;

        app.services.get("menu").add(
            <Menu order="0" label={t`Dashboard`} route="Dashboard" icon="fa-home">
                <Menu order="0" label={t`My Account`} route="Dashboard" icon="fa-home" />
                <Menu order="1" label={t`Settings`} route="Dashboard" icon="fa-home" />
            </Menu>
        );

        app.router.addRoute({
            name: "Profile",
            path: "/about/:id",
            component: () => import("./views/Profile").then(m => m.default)
        });

        app.router.addRoute({
            name: "About",
            path: "/about",
            component: () => import("./views/About").then(m => m.default)
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
            name: "Login",
            path: "/login",
            exact: true,
            render: () =>
                app.modules.load("Skeleton.Login").then(Login => {
                    return (
                        <Login
                            identity={"user"}
                            strategy={"credentials"}
                            onSuccess={() => {
                                app.router.goToRoute("About");
                            }}
                        />
                    );
                }),
            title: "Login"
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
