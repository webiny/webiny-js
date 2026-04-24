import { Route } from "@webiny/app-admin";

export const Routes = {
    Pages: {
        Workflows: new Route({
            name: "WebsiteBuilder/PageWorkflow",
            path: "/website-builder/workflows",
            params: zod => {
                return {
                    app: zod.string().optional()
                };
            }
        }),
        WorkflowStateList: new Route({
            name: "WebsiteBuilder/Pages/WorkflowStateList",
            path: "/website-builder/pages/content-reviews"
        })
    }
};
