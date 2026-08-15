import { Route } from "@webiny/app-admin";

export const Routes = {
    List: new Route({
        name: "ComponentExtraction/List",
        path: "/component-extraction"
    }),
    CreateJob: new Route({
        name: "ComponentExtraction/CreateJob",
        path: "/component-extraction/new"
    }),
    Job: new Route({
        name: "ComponentExtraction/Job",
        path: "/component-extraction/jobs/:jobId",
        params: zod => ({
            jobId: zod.string()
        })
    }),
    Run: new Route({
        name: "ComponentExtraction/Run",
        path: "/component-extraction/runs/:runId",
        params: zod => ({
            runId: zod.string()
        })
    })
};
