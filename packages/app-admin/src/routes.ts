import { Route } from "@webiny/app";

export const Routes = {
    Dashboard: new Route({
        name: "Dashboard",
        path: "/"
    }),

    FileManager: new Route({
        name: "FileManager",
        path: "/file-manager"
    }),

    FormModelDemo: new Route({
        name: "FormModelDemo",
        path: "/_/form-model-demo"
    }),

    CatchAll: new Route({
        name: "CatchAll",
        path: "*"
    })
};
