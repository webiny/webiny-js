// @flow
export default [
    {
        name: "FORMS Menus",
        description: "Grants complete access to FORMS menus.",
        slug: "forms-menus",
        scopes: ["forms:menu:crud"],
        system: true
    },
    {
        name: "FORMS Form Categories",
        description: "Grants complete access to FORMS form categories.",
        slug: "forms-categories",
        scopes: ["forms:category:crud"],
        system: true
    },
    {
        name: "FORMS Editor",
        description: "Grants complete access to FORMS forms.",
        slug: "forms-editor",
        scopes: [
            "forms:element:crud",
            "forms:tag:crud",
            "forms:settings",
            "forms:menu:crud",
            "forms:category:crud",
            "forms:form:crud",
            "forms:form:revision:create",
            "forms:form:revision:update",
            "forms:form:revision:delete",
            "forms:form:revision:publish"
        ],
        system: true
    },
    {
        name: "FORMS Settings",
        description: "Grants complete access to FORMS settings.",
        slug: "forms-settings",
        scopes: ["forms:settings"],
        system: true
    }
];
