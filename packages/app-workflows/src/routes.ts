import { Route } from "@webiny/app-admin";
import { WorkflowStateValue } from "~/types.js";

export const Routes = {
    Workflows: {
        ContentReviews: new Route({
            name: "Workflows/ContentReviews",
            path: "/workflows/content-reviews",
            params: z => {
                return {
                    type: z.enum(["own", "requested"]).optional(),
                    state: z.nativeEnum(WorkflowStateValue).optional()
                };
            }
        })
    }
};
