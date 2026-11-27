import { Route } from "@webiny/app-admin";

export const Routes = {
    ContentModels: {
        Workflows: new Route({
            name: "Cms/ContentModels/Workflows",
            path: "/cms/workflows",
            // The model the editor opens first, by `modelId`.
            params: zod => {
                return {
                    modelId: zod.string().optional()
                };
            }
        })
    },
    ContentEntries: {
        ContentReviews: new Route({
            name: "Cms/ContentEntries/WorkflowStateList",
            path: "/cms/content-reviews",
            params: zod => {
                return {
                    scope: zod.string().optional(),
                    state: zod.string().optional()
                };
            }
        })
    }
};
