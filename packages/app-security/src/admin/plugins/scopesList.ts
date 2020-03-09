import { i18n } from "@webiny/app/i18n";
import { SecurityScopesListPlugin } from "@webiny/app-security/types";

const t = i18n.ns("app-security/admin/scopesList");

export default [
    {
        name: "security-scopes-list-security",
        type: "security-scopes-list",
        scopes: [
            {
                scope: "security:group:crud",
                title: t`Security groups CRUD`,
                description: t`Allows CRUD operations on all groups.`
            },
            {
                scope: "security:role:crud",
                title: t`Security roles CRUD`,
                description: t`Allows CRUD operations on all roles.`
            },
            {
                scope: "security:user:crud",
                title: t`Security users CRUD`,
                description: t`Allows CRUD operations on all users.`
            }
        ]
    } as SecurityScopesListPlugin
];
