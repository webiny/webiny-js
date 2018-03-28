import { app } from "webiny-app";
import { app as uiApp } from "webiny-app-ui";
import Menu from "./services/menu";

export default () => {
    return (params, next) => {
        Promise.all([
            new Promise(res => uiApp()(params, res)),
        ]).then(() => {
            app.services.add("menu", () => new Menu());

            app.modules.register([
                {
                    name: "Skeleton.AdminLayout",
                    factory: () => import("./components/Layouts/AdminLayout")
                },
                {
                    name: "Skeleton.EmptyLayout",
                    factory: () => import("./components/Layouts/EmptyLayout")
                },
                {
                    name: "Skeleton.Header",
                    factory: () => import("./components/Header")
                },
                {
                    name: "Skeleton.Footer",
                    factory: () => import("./components/Footer")
                },
                {
                    name: "Skeleton.Logo",
                    factory: () => import("./components/Logo"),
                    tags: ['header-component']
                },
                {
                    name: "Skeleton.Navigation",
                    factory: () => import("./components/Navigation")
                },
                {
                    name: "Skeleton.Navigation.Desktop",
                    factory: () => import("./components/Navigation/Desktop")
                },
                {
                    name: "Skeleton.Navigation.Mobile",
                    factory: () => import("./components/Navigation/Mobile")
                }
            ]);

            next();
        });
    };
};
