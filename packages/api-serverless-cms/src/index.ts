import type { ClientContext } from "@webiny/handler-client/types";
import type { TenancyContext } from "@webiny/api-tenancy/types";
import type { SecurityContext } from "@webiny/api-security/types";
import type { I18NContext } from "@webiny/api-i18n/types";
import type { I18NContentContext } from "@webiny/api-i18n-content/types";
import type { PrerenderingServiceClientContext } from "@webiny/api-prerendering-service/client/types";
import type { FileManagerContext } from "@webiny/api-file-manager/types";
import type { CmsContext } from "@webiny/api-headless-cms/types";
import type { AcoContext } from "@webiny/api-aco/types";
import type { ContextPluginCallable } from "@webiny/api";
import { createContextPlugin as baseCreateContextPlugin } from "@webiny/api";
import type { GraphQLSchemaPluginConfig } from "@webiny/handler-graphql";
import { createGraphQLSchemaPlugin as baseCreateGraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { createSecurityRolePlugin, createSecurityTeamPlugin } from "@webiny/api-security";
import type { MailerContext } from "@webiny/api-mailer/types";
import type { Context as LoggerContext } from "@webiny/api-log/types";
import type { WebsiteBuilderContext } from "@webiny/api-website-builder";

export interface Context
    extends ClientContext,
        MailerContext,
        TenancyContext,
        SecurityContext,
        I18NContext,
        I18NContentContext,
        PrerenderingServiceClientContext,
        FileManagerContext,
        AcoContext,
        LoggerContext,
        CmsContext,
        WebsiteBuilderContext {}

export const createContextPlugin = <T extends Context = Context>(
    callable: ContextPluginCallable<T>
) => {
    return baseCreateContextPlugin<T>(callable);
};

export const createGraphQLSchemaPlugin = <T extends Context = Context>(
    config: GraphQLSchemaPluginConfig<T>
) => {
    return baseCreateGraphQLSchemaPlugin<T>(config);
};

export { createSecurityRolePlugin, createSecurityTeamPlugin };

export * from "./tenancy/InstallTenant";

export {
    // Model groups.
    createModelGroupPlugin,

    // Models.
    createModelPlugin,
    createSingleEntryModelPlugin,
    createPrivateModelPlugin,
    createPrivateSingleEntryModelPlugin,

    // Model fields (this is not a plugin factory, hence the missing `Plugin` suffix in the name).
    createModelField,

    // Other.
    createCmsGraphQLSchemaPlugin,
    createStorageTransformPlugin
} from "@webiny/api-headless-cms";
