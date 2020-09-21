import { i18n } from "@webiny/app/i18n";
import { SecurityScopesListPlugin } from "@webiny/app-security/types";

const t = i18n.ns("app-file-manager/admin/scopesList");

export default [
    {
        name: "security-scopes-list-file-manager",
        type: "security-scopes-list",
        scopes: [
            {
                scope: "files:file:crud",
                title: t`Files CRUD`,
                description: t`Allows basic CRUD operations on all files.`
            }
        ]
    } as SecurityScopesListPlugin
];
