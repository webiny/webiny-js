//@flow
import React from "react";
import SearchBar from "./SearchBar";
import type { GlobalSearch, HeaderMiddlePlugin } from "webiny-app-admin/types";

export const globalSearch: HeaderMiddlePlugin = {
    name: "global-search",
    type: "header-middle",
    render() {
        return <SearchBar />;
    }
};

// Additional sections in global search.
export const globalSearchUsers: GlobalSearch = {
    type: "global-search",
    name: "global-search-users",
    route: "Users",
    label: "Users",
    search: {
        fields: ["firstName", "lastName", "email"]
    }
};
