import { Route } from "@webiny/app-admin";

export const Routes = {
    ContentModels: {
        Workflows: new Route({
            name: "Cms/ContentModels/Workflows",
            path: "/cms/content-models/workflows",
            params: zod => {
                return {
                    app: zod.string().optional()
                };
            }
        })
    }
};
