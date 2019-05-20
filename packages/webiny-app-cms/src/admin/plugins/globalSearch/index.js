//@flow
import type { GlobalSearch } from "webiny-admin/types";

// Additional sections in global search.

export default ([
    {
        type: "global-search",
        name: "global-search-categories",
        route: "/cms/categories",
        label: "Categories",
        search: {
            fields: ["name", "slug"]
        }
    },
    {
        type: "global-search",
        name: "global-search-pages",
        route: "/cms/pages",
        label: "Pages"
    }
]: Array<GlobalSearch>);
