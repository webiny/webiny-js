import contentModelGroupCrud from "./plugins/crud/contentModelGroup.crud";
import contentModelCrud from "./plugins/crud/contentModel.crud";
import contentModelEntry from "./plugins/crud/contentModelEntry.crud";
import pluginsCrudSetup from "../plugins/crud";
import { graphQLHandlerFactory } from "./graphQLHandlerFactory";
import contextSetup from "./contextSetup";
import contentModelManager from "./plugins/contentModelManager";
import fieldTypePlugins from "./plugins/graphqlFields";
import validatorsPlugins from "./plugins/validators";

type CmsContentPluginsIndexArgsType = {
    debug?: boolean;
};

export default (options: CmsContentPluginsIndexArgsType = {}) => [
    contentModelManager(),
    pluginsCrudSetup(),
    contextSetup(options),
    contentModelGroupCrud(),
    contentModelCrud(),
    contentModelEntry(),
    graphQLHandlerFactory(options),
    fieldTypePlugins(),
    validatorsPlugins()
];
