import { GlobalSearchPlugin } from "@webiny/app-admin/types";

// Additional sections in global search.

const plugins: GlobalSearchPlugin[] = [
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
];

export default plugins;
