import { AdminGlobalSearchPlugin } from "@webiny/app-admin/types";

// Additional sections in global search.
export const globalSearchUsers: AdminGlobalSearchPlugin = {
    type: "admin-global-search",
    name: "global-search-users",
    route: "/users",
    label: "Users",
    search: {
        fields: ["firstName", "lastName", "email"]
    }
};
