import { Route } from "@webiny/app-admin";

export const Routes = {
    Pages: {
        Workflows: new Route({
            name: "WebsiteBuilder/PageWorkflow",
            path: "/website-builder/workflows"
        }),
        WorkflowStateList: new Route({
            name: "WebsiteBuilder/Pages/WorkflowStateList",
            path: "/website-builder/pages/content-reviews",
            params: zod => {
                return {
                    tab: zod.string().optional()
                };
            }
        })
    }
};
