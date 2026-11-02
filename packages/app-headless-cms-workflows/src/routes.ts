import { Route } from "@webiny/app-admin";

export const Routes = {
    ContentModels: {
        Workflows: new Route({
            name: "Cms/ContentModels/Workflows",
            path: "/cms/workflows"
        })
    },
    ContentEntries: {
        ContentReviews: new Route({
            name: "Cms/ContentEntries/WorkflowStateList",
            path: "/cms/content-reviews",
            params: zod => {
                return {
                    tab: zod.string().optional()
                };
            }
        })
    }
};
