//@flow
import type { GlobalSearch } from "webiny-admin/types";

// Additional sections in global search.
export const globalSearchUsers: GlobalSearch = {
    type: "global-search",
    name: "global-search-users",
    route: "/users",
    label: "Users",
    search: {
        fields: ["firstName", "lastName", "email"]
    }
};
