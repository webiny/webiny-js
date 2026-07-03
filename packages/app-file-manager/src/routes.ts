import { Route } from "@webiny/app-admin";

export const Routes = {
    List: new Route({
        name: "FileManager/List",
        path: "/file-manager",
        params: zod => {
            return {
                folderId: zod.string().optional(),
                search: zod.string().optional()
            };
        }
    }),
    Settings: new Route({
        name: "FileManager/Settings",
        path: "/settings/file-manager/general"
    })
};
