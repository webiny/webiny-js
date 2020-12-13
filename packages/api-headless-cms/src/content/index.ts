import contentModelCrud from "./plugins/crud/contentModel.crud";
import pluginsCrudSetup from "../plugins/crud";
import { graphQLHandlerFactory } from "./graphQLHandlerFactory";
import contextSetup from "./contextSetup";

type CmsContentPluginsIndexArgsType = {
    debug?: boolean;
};

export default (options: CmsContentPluginsIndexArgsType) => [
    pluginsCrudSetup(),
    contextSetup(options),
    contentModelCrud,
    graphQLHandlerFactory(options)
];
