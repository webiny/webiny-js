// @flow
import type {PluginType} from "webiny-plugins/types";

export type SecurityPluginType = PluginType & {
    authenticate: Function
}
