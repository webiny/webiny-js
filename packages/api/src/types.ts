import { PluginsContainer } from "./PluginsContainer";

export { PluginsContainer };

export type PluginType = Record<string, any> & {
    name: string;
    type: string;
};

export type GraphQLMiddlewarePlugin = PluginType & {
    middleware: () => Record<string, any>;
};
