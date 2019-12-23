// @flow
// import { PluginType } from "@webiny/api/types";

export type SecurityPluginType = Object & {
    authenticate: Function
};
