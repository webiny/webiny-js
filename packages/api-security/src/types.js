// @flow
import type { PluginType } from "@webiny/api/types";

export type SecurityPluginType = PluginType & {
    authenticate: Function
};
