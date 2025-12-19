import type { CreateWbRedirectData } from "~/context/redirects/redirects.types.js";

export const redirectMocks: Record<string, CreateWbRedirectData> = {
    redirectA: {
        redirectFrom: "/old-page-a",
        redirectTo: "/new-page-a",
        redirectType: "permanent",
        isEnabled: true,
        location: {
            folderId: "root"
        }
    },
    redirectB: {
        redirectFrom: "/old-page-b",
        redirectTo: "/new-page-b",
        redirectType: "temporary",
        isEnabled: true,
        location: {
            folderId: "root"
        }
    },
    redirectC: {
        redirectFrom: "/old-page-c",
        redirectTo: "/new-page-c",
        redirectType: "permanent",
        isEnabled: true,
        location: {
            folderId: "root"
        }
    }
};
