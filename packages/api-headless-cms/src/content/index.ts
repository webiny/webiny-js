import contentModelGroupCrud from "./plugins/crud/contentModelGroup.crud";
import contentModelCrud from "./plugins/crud/contentModel.crud";
import contentEntry from "./plugins/crud/contentEntry.crud";
import pluginsCrudSetup from "../plugins/crud";
import { graphQLHandlerFactory } from "./graphQLHandlerFactory";
import contextSetup from "./contextSetup";
import contentModelManager from "./plugins/contentModelManager";
import fieldTypePlugins from "./plugins/graphqlFields";
import validatorsPlugins from "./plugins/validators";
import elasticSearchOperators from "./plugins/es";

type CmsContentPluginsIndexArgsType = {
    debug?: boolean;
};

export default (options: CmsContentPluginsIndexArgsType = {}) => [
    contentModelManager(),
    pluginsCrudSetup(),
    contextSetup(options),
    contentModelGroupCrud(),
    contentModelCrud(),
    contentEntry(),
    graphQLHandlerFactory(options),
    fieldTypePlugins(),
    validatorsPlugins(),
    elasticSearchOperators()
];
