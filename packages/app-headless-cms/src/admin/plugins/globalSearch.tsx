import { AdminGlobalSearchPlugin } from "@webiny/app-admin/types";

// Additional sections in global search.1
const plugins: AdminGlobalSearchPlugin[] = [
    {
        type: "admin-global-search",
        name: "admin-global-search-headless-cms-content",
        route: "/cms/content-models/manage/motor",
        label: "Motors",
        search: {
            fields: ["size"]
        }
    },
    {
        type: "admin-global-search",
        name: "admin-global-search-headless-cms-content1,",
        route: "/cms/content-models/manage/motor",
        label: "Motors",
        search: {
            fields: ["size"]
        }
    },
    {
        type: "admin-global-search",
        name: "admin-global-search-headless-cms-content2",
        route: "/cms/content-models/manage/motor",
        label: "Motors",
        search: {
            fields: ["size"]
        }
    },
    {
        type: "admin-global-search",
        name: "admin-global-search-headless-cms-content3",
        route: "/cms/content-models/manage/motor",
        label: "Motors",
        search: {
            fields: ["size"]
        }
    },
    {
        type: "admin-global-search",
        name: "admin-global-search-headless-cms-content4",
        route: "/cms/content-models/manage/motor",
        label: "Motors",
        search: {
            fields: ["size"]
        }
    },
    {
        type: "admin-global-search",
        name: "admin-global-search-headless-cms-content5",
        route: "/cms/content-models/manage/motor",
        label: "Motors",
        search: {
            fields: ["size"]
        }
    },
    {
        type: "admin-global-search",
        name: "admin-global-search-headless-cms-content6",
        route: "/cms/content-models/manage/motor",
        label: "Motors",
        search: {
            fields: ["size"]
        }
    }
];

export default plugins;
