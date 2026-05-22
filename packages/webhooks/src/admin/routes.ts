import { Route } from "@webiny/app-admin";

export const Routes = {
    List: new Route({
        name: "Webhooks/List",
        path: "/webhooks"
    }),
    Deliveries: new Route({
        name: "Webhooks/Deliveries",
        path: "/webhooks/deliveries"
    }),
    Settings: new Route({
        name: "Webhooks/Settings",
        path: "/webhooks/settings"
    }),
    Form: new Route({
        name: "Webhooks/Form",
        path: "/webhooks/:id",
        params: zod => ({
            id: zod.string()
        })
    })
};
