import { createGraphQLPlugin } from "~/plugins/graphql";
import { createAdminCruds, Params as CreateAdminCrudsParams } from "~/plugins/crud";
import context from "~/plugins/context";
import upgrades from "~/plugins/upgrades";
import contextSetup from "~/content/contextSetup";
import modelManager from "~/content/plugins/modelManager";
import { createContentCruds, Params as CreateContentCrudsParams } from "~/content/plugins/crud";
import fieldTypePlugins from "~/content/plugins/graphqlFields";
import validatorsPlugins from "~/content/plugins/validators";
import defaultStoragePlugin from "~/content/plugins/storage/default";
import objectStoragePlugin from "~/content/plugins/storage/object";
import {
    CreateGraphQLHandlerOptions,
    graphQLHandlerFactory
} from "~/content/graphQLHandlerFactory";

import { StorageTransformPlugin } from "~/content/plugins/storage/StorageTransformPlugin";
import { createParametersPlugins, CreateParametersPluginsParams } from "~/content/parameterPlugins";
import { CmsParametersPlugin } from "./content/plugins/CmsParametersPlugin";

export type AdminContextParams = CreateAdminCrudsParams;

export const createAdminHeadlessCmsContext = (params: AdminContextParams) => {
    return [context(), createAdminCruds(params), upgrades()];
};

export const createAdminHeadlessCmsGraphQL = () => {
    return createGraphQLPlugin();
};

export interface ContentContextParams
    extends CreateContentCrudsParams,
        CreateParametersPluginsParams {}
export const createContentHeadlessCmsContext = (params: ContentContextParams) => {
    return [
        createParametersPlugins(params),
        contextSetup(),
        modelManager(),
        createContentCruds(params),
        fieldTypePlugins(),
        validatorsPlugins(),
        defaultStoragePlugin(),
        objectStoragePlugin()
        // new InternalAuthenticationPlugin("read-api-key"),
        // new InternalAuthorizationPlugin("read-api-key")
    ];
};
export type ContentGraphQLParams = CreateGraphQLHandlerOptions;
export const createContentHeadlessCmsGraphQL = (params?: ContentGraphQLParams) => {
    return graphQLHandlerFactory(params);
};

export { StorageTransformPlugin, CmsParametersPlugin };
