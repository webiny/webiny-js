import contentModelGroupCrud from "./plugins/crud/contentModelGroup.crud";
import contentModelCrud from "./plugins/crud/contentModel.crud";
import contentEntry from "./plugins/crud/contentEntry.crud";
import pluginsCrudSetup from "../plugins/crud";
import { graphQLHandlerFactory } from "./graphQLHandlerFactory";
import contextSetup from "./contextSetup";
import modelManager from "./plugins/modelManager";
import fieldTypePlugins from "./plugins/graphqlFields";
import validatorsPlugins from "./plugins/validators";
import { InternalAuthenticationPlugin } from "./plugins/internalSecurity/InternalAuthenticationPlugin";
import { InternalAuthorizationPlugin } from "./plugins/internalSecurity/InternalAuthorizationPlugin";

interface CmsContentPluginsIndexArgs {
    debug?: boolean;
}

export default (options: CmsContentPluginsIndexArgs = {}) => [
    modelManager(),
    pluginsCrudSetup(),
    contextSetup(),
    contentModelGroupCrud(),
    contentModelCrud(),
    contentEntry(),
    graphQLHandlerFactory(options),
    fieldTypePlugins(),
    validatorsPlugins(),
    new InternalAuthenticationPlugin("read-api-key"),
    new InternalAuthorizationPlugin("read-api-key")
];
