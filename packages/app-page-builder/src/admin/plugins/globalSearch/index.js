//@flow
import type { GlobalSearch } from "@webiny/app-admin/types";

// Additional sections in global search.

export default ([
    {
        type: "global-search",
        name: "global-search-categories",
        route: "/page-builder/categories",
        label: "Categories",
        search: {
            fields: ["name", "slug"]
        }
    },
    {
        type: "global-search",
        name: "global-search-pages",
        route: "/page-builder/pages",
        label: "Pages"
    }
]: Array<GlobalSearch>);
