import { Route } from "@webiny/app-admin";

export const Routes = {
    List: new Route({
        name: "Theme/List",
        path: "/theme",
        params: zod => {
            return {
                search: zod.string().optional()
            };
        }
    }),
    Editor: new Route({
        name: "Theme/Editor",
        path: "/theme/:id",
        params: zod => {
            return {
                id: zod.string(),
                /** Selected token group in the left rail. Defaults to colours. */
                group: zod.string().optional()
            };
        }
    })
};
