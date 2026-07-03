import { Route } from "webiny/admin/router";

export const EntryRoute = new Route({
    name: "Cms/ContentEntries/List",
    path: "/cms/content-entries/:modelId",
    params: zod => {
        return {
            modelId: zod.string(),
            id: zod.string().optional(),
            folderId: zod.string().optional(),
            search: zod.string().optional(),
            new: zod.boolean().optional(),
            customFlag: zod.boolean().optional()
        };
    }
});
