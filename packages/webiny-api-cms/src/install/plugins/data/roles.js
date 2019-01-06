// @flow
export default [
    {
        name: "CMS Menus",
        description: "Grants complete access to CMS menus.",
        slug: "cms-menus",
        scopes: ["cms:menu:crud"]
    },
    {
        name: "CMS Page Categories",
        description: "Grants complete access to CMS page categories.",
        slug: "cms-categories",
        scopes: ["cms:category:crud"]
    },
    {
        name: "CMS Editor",
        description: "Grants complete access to CMS pages.",
        slug: "cms-editor",
        scopes: [
            "cms:element:crud",
            "cms:page:crud",
            "cms:page:revision:create",
            "cms:page:revision:update",
            "cms:page:revision:delete",
            "cms:page:revision:publish"
        ]
    },
    {
        name: "CMS Settings",
        description: "Grants complete access to CMS settings.",
        slug: "cms-settings",
        scopes: ["cms:settings"]
    }
];
