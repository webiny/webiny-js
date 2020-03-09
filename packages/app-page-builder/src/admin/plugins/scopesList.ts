import { i18n } from "@webiny/app/i18n";
import { SecurityScopesListPlugin } from "@webiny/app-security/types";

const t = i18n.ns("app-page-builder/admin/scopesList");

export default [
    {
        name: "security-scopes-list-page-builder",
        type: "security-scopes-list",
        scopes: [
            {
                scope: "pb:page:crud",
                title: t`Pages CRUD`,
                description: t`Allows CRUD operations on all pages.`
            },
            {
                scope: "pb:menu:crud",
                title: t`Menus CRUD`,
                description: t`Allows CRUD operations on all menus.`
            },
            {
                scope: "pb:category:crud",
                title: t`Categories CRUD`,
                description: t`Allows CRUD operations on all categories.`
            },
            {
                scope: "pb:element:crud",
                title: t`Elements CRUD`,
                description: t`Allows CRUD operations on all elements.`
            },
            {
                scope: "pb:oembed:read",
                title: t`Read oEmbed data`,
                description: t`Allows reading oEmbed data in the Page Builder editor.`
            }
        ]
    } as SecurityScopesListPlugin
];
