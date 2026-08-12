import { Route } from "@webiny/app-admin";

export const Routes = {
    List: new Route({
        name: "ComponentExtraction/List",
        path: "/component-extraction"
    }),
    Run: new Route({
        name: "ComponentExtraction/Run",
        path: "/component-extraction/runs/:runId",
        params: zod => ({
            runId: zod.string()
        })
    })
};
