//@flow
import type { GlobalSearch } from "webiny-admin/types";

// Additional sections in global search.

export default ([
    {
        type: "global-search",
        name: "global-search-categories",
        route: "Cms.Categories",
        label: "Categories",
        search: {
            fields: ["name", "slug"]
        }
    },
    {
        type: "global-search",
        name: "global-search-pages",
        route: "Cms.Pages",
        label: "Pages"
    }
]: Array<GlobalSearch>);
