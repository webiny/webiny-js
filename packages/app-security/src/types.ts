import { Plugin } from "@webiny/app/types";

// TODO: REVIEW AND MOVE

// TODO: this will be removed entirely, in favor of a more complex UI plugins
type SecurityScopesListPluginScope = {
    title: any;
    description: any;
    scope: string;
};

/**
 * Enables adding custom security scopes to the multi-select autocomplete component in the Roles form.
 * @see https://docs.webiny.com/docs/webiny-apps/security/development/plugin-reference/app/#security-scopes-list
 */
export type SecurityScopesListPlugin = Plugin & {
    type: "security-scopes-list";
    scopes:
        | SecurityScopesListPluginScope[]
        | (() => SecurityScopesListPluginScope[])
        | (({ apolloClient }) => Promise<SecurityScopesListPluginScope[]>);
};
