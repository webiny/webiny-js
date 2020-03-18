import { i18n } from "@webiny/app/i18n";
import { SecurityScopesListPlugin } from "@webiny/app-security/types";

const t = i18n.ns("app-i18n/admin/scopesList");

export default [
    {
        name: "security-scopes-list-i18n",
        type: "security-scopes-list",
        scopes: [
            {
                scope: "i18n:locale:crud",
                title: t`I18N locales CRUD`,
                description: t`Allows CRUD operations on all locales.`
            },
        ]
    } as SecurityScopesListPlugin
];
