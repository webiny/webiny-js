// @flow
export default [
    {
        name: "Page Builder Menus",
        description: "Grants complete access to Page Builder menus.",
        slug: "pb-menus",
        scopes: ["pb:menu:crud"],
        system: true
    },
    {
        name: "Page Builder Page Categories",
        description: "Grants complete access to Page Builder page categories.",
        slug: "pb-categories",
        scopes: ["pb:category:crud"],
        system: true
    },
    {
        name: "Page Builder Editor",
        description: "Grants complete access to Page Builder pages.",
        slug: "pb-editor",
        scopes: [
            "pb:element:crud",
            "pb:tag:crud",
            "pb:settings",
            "pb:menu:crud",
            "pb:category:crud",
            "pb:page:crud",
            "pb:page:revision:create",
            "pb:page:revision:update",
            "pb:page:revision:delete",
            "pb:page:revision:publish"
        ],
        system: true
    },
    {
        name: "Page Builder Settings",
        description: "Grants complete access to Page Builder settings.",
        slug: "pb-settings",
        scopes: ["pb:settings"],
        system: true
    }
];
