import { i18n } from "@webiny/app/i18n";
import { SecurityScopesListPlugin } from "@webiny/app-security/types";

const t = i18n.ns("app-security/admin/scopesList");

const generateCmsScopes = async () => {
    try {
        // TODO: add actual scopes here. There are two options:
        //  -query the db, get <environments>, generate the scopes
        //  -receive <scopes> as a parameter
        return [
            {
                scope: "cms:read:production:potatoes",
                title: t`Cms "potatoes" /read api permissions`,
                description: t`Allows you to use the /read api against model "potatoes"`
            }
        ];
    } catch (e) {
        console.log("Failed to fetch cms scopes:");
        console.log(e);
    }
};

export default [
    {
        name: "security-scopes-list-access-tokens",
        type: "security-scopes-list",
        scopes: generateCmsScopes
    } as SecurityScopesListPlugin
];
