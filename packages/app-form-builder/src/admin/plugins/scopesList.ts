import { i18n } from "@webiny/app/i18n";
import { SecurityScopesListPlugin } from "@webiny/app-security/types";

const t = i18n.ns("app-form-builder/admin/scopesList");

export default [
    {
        name: "security-scopes-list-form-builder",
        type: "security-scopes-list",
        scopes: [
            {
                scope: "forms:form:crud",
                title: t`Forms CRUD`,
                description: t`Allows basic CRUD operations on all forms.`
            },
            {
                scope: "forms:settings",
                title: t`Form Builder Settings`,
                description: t`Allows updating Form Builder's settings.`
            },
            {
                scope: "forms:form:revision:publish",
                title: t`Publish form revisions`,
                description: t`Allows publishing form revision.`
            },
            {
                scope: "forms:form:revision:unpublish",
                title: t`Unpublish form revisions`,
                description: t`Allows unpublishing form revisions.`
            },
            {
                scope: "forms:form:submissions:export",
                title: t`Export form submissions`,
                description: t`Allows creating form submission exports.`
            }
        ]
    } as SecurityScopesListPlugin
];
