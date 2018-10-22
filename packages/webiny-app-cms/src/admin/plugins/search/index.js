// @flow
import type { SearchPlugin } from "webiny-app-admin/types";

// Additional sections in global search.
export const searchBarCategories: SearchPlugin = {
    type: "global-search",
    name: "global-search-cms-categories",
    route: "Cms.Categories",
    label: "CMS categories"
};

export const searchBarPages: SearchPlugin = {
    type: "global-search",
    name: "global-search-cms-pages",
    route: "Cms.Pages",
    label: "CMS Pages"
};