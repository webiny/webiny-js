import { ClientContext } from "@webiny/handler-client/types";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { SecurityContext } from "@webiny/api-security/types";
import { I18NContext } from "@webiny/api-i18n/types";
import { I18NContentContext } from "@webiny/api-i18n-content/types";
import { PbContext } from "@webiny/api-page-builder/graphql/types";
import { PrerenderingServiceClientContext } from "@webiny/api-prerendering-service/client/types";
import { FileManagerContext } from "@webiny/api-file-manager/types";
import { FormBuilderContext } from "@webiny/api-form-builder/types";
import { CmsContext } from "@webiny/api-headless-cms/types";
import { AcoContext } from "@webiny/api-aco/types";
import { PbAcoContext } from "@webiny/api-page-builder-aco/types";
import { createContextPlugin as baseCreateContextPlugin, ContextPluginCallable } from "@webiny/api";
import {
    createGraphQLSchemaPlugin as baseCreateGraphQLSchemaPlugin,
    GraphQLSchemaPluginConfig
} from "@webiny/handler-graphql";
import { createSecurityRolePlugin, createSecurityTeamPlugin } from "@webiny/api-security";

export interface Context
    extends ClientContext,
        TenancyContext,
        SecurityContext,
        I18NContext,
        I18NContentContext,
        PbContext,
        PrerenderingServiceClientContext,
        FileManagerContext,
        FormBuilderContext,
        AcoContext,
        PbAcoContext,
        CmsContext {}

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
