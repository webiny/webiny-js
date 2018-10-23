// @flow
import type { GlobalSearch } from "webiny-app-admin/types";

// Additional sections in global search.
export const globalSearchCategories: GlobalSearch = {
    type: "global-search",
    name: "global-search-cms-categories",
    route: "Cms.Categories",
    label: "CMS categories",
    search: {
        fields: ["name"]
    }
};

export const globalSearchPages: GlobalSearch = {
    type: "global-search",
    name: "global-search-cms-pages",
    route: "Cms.Pages",
    label: "CMS Pages",
    search: {
        fields: ["title"]
    }
};
