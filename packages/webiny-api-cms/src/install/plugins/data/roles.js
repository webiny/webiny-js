// @flow
export default [
    {
        name: "CMS Menus",
        description: "Grants complete access to CMS menus.",
        slug: "cms-menus",
        scopes: [
            "cms:menu:get",
            "cms:menu:list",
            "cms:menu:create",
            "cms:menu:update",
            "cms:menu:delete"
        ]
    },
    {
        name: "CMS Page Categories",
        description: "Grants complete access to CMS page categories.",
        slug: "cms-page-categories",
        scopes: [
            "cms:category:get",
            "cms:category:list",
            "cms:category:create",
            "cms:category:update",
            "cms:category:delete"
        ]
    },
    {
        name: "CMS Tags",
        description: "Grants complete access to tags.",
        slug: "cms-tags",
        scopes: [
            "cms:tag:create",
            "cms:tag:get",
            "cms:tag:list",
            "cms:tag:update",
            "cms:tag:delete"
        ]
    },
    {
        name: "CMS Pages",
        description: "Grants complete access to CMS pages.",
        slug: "cms-pages",
        scopes: [
            "cms:page:list",
            "cms:page:create",
            "cms:page:delete",
            "cms:page:revision:create",
            "cms:page:revision:update",
            "cms:page:revision:delete"
        ]
    }
];
