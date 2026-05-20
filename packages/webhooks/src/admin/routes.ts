import { Route } from "@webiny/app-admin";

export const Routes = {
    List: new Route({
        name: "Webhooks/List",
        path: "/webhooks"
    }),
    Form: new Route({
        name: "Webhooks/Form",
        path: "/webhooks/:id",
        params: zod => ({
            id: zod.string()
        })
    }),
    Settings: new Route({
        name: "Webhooks/Settings",
        path: "/webhooks/settings"
    })
};
