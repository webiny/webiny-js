import { Route } from "@webiny/app-admin";

export const Routes = {
    Pages: {
        List: new Route({
            name: "WebsiteBuilder/Pages/List",
            path: "/website-builder/pages",
            params: zod => {
                return {
                    folderId: zod.string().optional(),
                    search: zod.string().optional()
                };
            }
        }),
        Editor: new Route({
            name: "WebsiteBuilder/Pages/Editor",
            path: "/website-builder/pages/editor/:id",
            params: zod => {
                return {
                    id: zod.string(),
                    folderId: zod.string().optional(),
                    key: zod.string().optional()
                };
            }
        })
    },
    Layouts: {
        List: new Route({
            name: "WebsiteBuilder/Layouts/List",
            path: "/website-builder/layouts"
        }),
        Editor: new Route({
            name: "WebsiteBuilder/Layouts/Editor",
            path: "/website-builder/layouts/editor/:id",
            params: zod => {
                return {
                    id: zod.string()
                };
            }
        })
    },
    Redirects: {
        List: new Route({
            name: "WebsiteBuilder/Redirects/List",
            path: "/website-builder/redirects",
            params: zod => {
                return {
                    folderId: zod.string().optional(),
                    search: zod.string().optional()
                };
            }
        })
    }
};
