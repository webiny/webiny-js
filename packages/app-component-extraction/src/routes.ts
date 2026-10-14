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
    /**
     * A run, optionally opened on the composed-pages panel and on one page's comparison.
     *
     * `composed` and `page` are query params — `RouteUrl` puts anything not in the path into the
     * query string — and they are here for one reason: the comparison produces evidence about a
     * specific page that someone wants to send to a colleague or show a customer, and a comparison
     * that cannot be linked is the wrong shape for that. They also make a reload keep its place, and
     * put the page being looked at in the URL rather than in invisible presenter state.
     *
     * The other panels (Overrides, Token usage) deliberately have none of this. They are a developer
     * inspecting something in their own session; nobody links to them.
     *
     * `composed` is set or absent, never `false`: the route layer coerces params, and
     * `z.coerce.boolean()` reads the string "false" as `true` because a non-empty string is truthy.
     * Closing the panel removes the param, which `RouteUrl` drops from the query string.
     */
    Run: new Route({
        name: "ComponentExtraction/Run",
        path: "/component-extraction/runs/:runId",
        params: zod => ({
            runId: zod.string(),
            /** The open step: a stage name, or "site". Kept so a reload stays where it was. */
            stage: zod.string().optional(),
            composed: zod.boolean().optional(),
            /** The Website Builder path of the page whose comparison is open. */
            page: zod.string().optional()
        })
    }),
    RunInspector: new Route({
        name: "ComponentExtraction/RunInspector",
        path: "/component-extraction/runs/:runId/inspect",
        params: zod => ({
            runId: zod.string()
        })
    })
};
