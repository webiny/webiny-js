import { Route } from "@webiny/app-admin";

export const Routes = {
    Definitions: new Route({
        name: "BackgroundTasks/Definitions",
        path: "/background-tasks/definitions"
    }),
    Executions: new Route({
        name: "BackgroundTasks/Executions",
        path: "/background-tasks/executions"
    }),
    Settings: new Route({
        name: "BackgroundTasks/Settings",
        path: "/background-tasks/settings"
    })
};
