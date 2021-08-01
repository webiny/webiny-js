import contentModelGroupCrud from "./plugins/crud/contentModelGroup.crud";
import contentModelCrud from "./plugins/crud/contentModel.crud";
import contentEntry from "./plugins/crud/contentEntry.crud";
import pluginsCrudSetup from "../plugins/crud";
import { graphQLHandlerFactory } from "./graphQLHandlerFactory";
import contextSetup from "./contextSetup";
import modelManager from "./plugins/modelManager";
import fieldTypePlugins from "./plugins/graphqlFields";
import defaultStoragePlugin from "./plugins/storage/default";
import objectStoragePlugin from "./plugins/storage/object";
import validatorsPlugins from "./plugins/validators";
import { InternalAuthenticationPlugin } from "./plugins/internalSecurity/InternalAuthenticationPlugin";
import { InternalAuthorizationPlugin } from "./plugins/internalSecurity/InternalAuthorizationPlugin";

interface CmsContentPluginsIndexArgs {
    debug?: boolean;
}

export default (options: CmsContentPluginsIndexArgs = {}) => [
    contextSetup(),
    modelManager(),
    pluginsCrudSetup(),
    contentModelGroupCrud(),
    contentModelCrud(),
    contentEntry(),
    graphQLHandlerFactory(options),
    fieldTypePlugins(),
    validatorsPlugins(),
    defaultStoragePlugin(),
    objectStoragePlugin(),
    new InternalAuthenticationPlugin("read-api-key"),
    new InternalAuthorizationPlugin("read-api-key")
];
