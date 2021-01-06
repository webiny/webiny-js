import contentModelGroupCrud from "./plugins/crud/contentModelGroup.crud";
import contentModelCrud from "./plugins/crud/contentModel.crud";
import contentEntry from "./plugins/crud/contentEntry.crud";
import pluginsCrudSetup from "../plugins/crud";
import { graphQLHandlerFactory } from "./graphQLHandlerFactory";
import contextSetup from "./contextSetup";
import modelManager from "./plugins/modelManager";
import fieldTypePlugins from "./plugins/graphqlFields";
import validatorsPlugins from "./plugins/validators";
import elasticSearchPlugins from "./plugins/es";
import fieldsStoragePlugins from "./plugins/fieldsStorage";

type CmsContentPluginsIndexArgsType = {
    debug?: boolean;
};

export default (options: CmsContentPluginsIndexArgsType = {}) => [
    modelManager(),
    pluginsCrudSetup(),
    contextSetup(options),
    contentModelGroupCrud(),
    contentModelCrud(),
    contentEntry(),
    graphQLHandlerFactory(options),
    fieldTypePlugins(),
    fieldsStoragePlugins(),
    validatorsPlugins(),
    elasticSearchPlugins()
];
