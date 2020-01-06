import { GlobalSearchPlugin } from "@webiny/app-admin/types";

// Additional sections in global search.
export const globalSearchUsers: GlobalSearchPlugin = {
    type: "global-search",
    name: "global-search-users",
    route: "/users",
    label: "Users",
    search: {
        fields: ["firstName", "lastName", "email"]
    }
};
