import { Route } from "@webiny/app-admin";

export const Routes = {
    Workflows: {
        ContentReviews: new Route({
            name: "Workflows/ContentReviews",
            path: "/workflows/content-reviews/:type",
            params: z => {
                return {
                    type: z.enum(["own", "requested"]).optional()
                };
            }
        })
    }
};
