// @flow
import type { PluginType } from "@webiny/plugins/types";

export type GraphQLMiddlewarePluginType = PluginType & {
    middleware: () => Object
};
