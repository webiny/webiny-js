import { app } from "webiny-app";
import { app as uiApp } from "webiny-app-ui";
import Menu from "./services/menu";

export default () => {
    return (params, next) => {
        Promise.all([
            new Promise(res => uiApp()(params, res)),
        ]).then(() => {
            app.services.register("menu", () => new Menu());

            app.modules.register([
                {
                    name: "Admin.Layout",
                    factory: () => import("./components/Layouts/AdminLayout")
                },
                {
                    name: "Admin.EmptyLayout",
                    factory: () => import("./components/Layouts/EmptyLayout")
                },
                {
                    name: "Admin.Header",
                    factory: () => import("./components/Header")
                },
                {
                    name: "Admin.Footer",
                    factory: () => import("./components/Footer")
                },
                {
                    name: "Admin.Logo",
                    factory: () => import("./components/Logo"),
                    tags: ['header-component']
                },
                {
                    name: "Admin.Navigation",
                    factory: () => import("./components/Navigation")
                },
                {
                    name: "Admin.Navigation.Desktop",
                    factory: () => import("./components/Navigation/Desktop")
                },
                {
                    name: "Admin.Navigation.Mobile",
                    factory: () => import("./components/Navigation/Mobile")
                }
            ]);

            next();
        });
    };
};
