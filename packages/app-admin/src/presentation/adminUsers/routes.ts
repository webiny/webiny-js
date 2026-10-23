import { Route } from "@webiny/app";

export const Routes = {
    Users: {
        List: new Route({
            name: "AdminUsers/List",
            path: "/admin-users",
            params: z => {
                return {
                    id: z.string().optional(),
                    new: z.boolean().optional()
                };
            }
        }),
        Account: new Route({
            name: "AdminUsers/Account",
            path: "/account"
        })
    }
};
