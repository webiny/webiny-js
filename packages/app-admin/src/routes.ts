import { Route } from "@webiny/app-admin";

export const Routes = {
    Dashboard: new Route({
        name: "Dashboard",
        path: "/"
    }),

    FileManager: new Route({
        name: "FileManager",
        path: "/file-manager"
    }),

    CatchAll: new Route({
        name: "CatchAll",
        path: "*"
    })
};
