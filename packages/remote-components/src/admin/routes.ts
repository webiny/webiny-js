import { Route } from "@webiny/app-admin";

export const Routes = {
    List: new Route({
        name: "RemoteComponents/List",
        path: "/remote-components"
    }),
    Editor: new Route({
        name: "RemoteComponents/Editor",
        path: "/remote-components/editor/:id",
        params: zod => ({
            id: zod.string()
        })
    })
};
