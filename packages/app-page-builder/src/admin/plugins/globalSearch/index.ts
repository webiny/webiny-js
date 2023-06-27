import { AdminGlobalSearchPlugin } from "@webiny/app-admin/types";

// Additional sections in global search.

const plugins: AdminGlobalSearchPlugin[] = [
    {
        type: "admin-global-search",
        name: "global-search-pages",
        route: "/page-builder/pages",
        label: "Pages"
    }
];

export default plugins;
