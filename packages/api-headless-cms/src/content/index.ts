import { graphQLHandlerFactory } from "./graphQLHandlerFactory";
import contextSetup from "./contextSetup";
import modelManager from "./plugins/modelManager";
import fieldTypePlugins from "./plugins/graphqlFields";
import defaultStoragePlugin from "./plugins/storage/default";
import objectStoragePlugin from "./plugins/storage/object";
import validatorsPlugins from "./plugins/validators";
import { createContentCruds } from "~/content/plugins/crud";
import { HeadlessCmsStorageOperations } from "~/types";
// import { InternalAuthenticationPlugin } from "./plugins/internalSecurity/InternalAuthenticationPlugin";
// import { InternalAuthorizationPlugin } from "./plugins/internalSecurity/InternalAuthorizationPlugin";

export interface Params {
    storageOperations: HeadlessCmsStorageOperations;
    setupGraphQL?: boolean;
    debug?: boolean;
}
export const createContentHeadlessCms = (params: Params) => {
    const plugins: any = [
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
    /**
     * By default we include the GraphQL.
     */
    if (params.setupGraphQL !== false) {
        plugins.push(graphQLHandlerFactory(params));
    }
    return plugins;
};
