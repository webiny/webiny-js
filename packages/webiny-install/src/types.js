// @flow
import { type PluginType } from "webiny-plugins/types";
export type InstallPluginType = PluginType & {
    meta: {
        name: string,
        description: name
    },
    install: () => Promise<void>
};
