// @flow
import { type PluginType } from "webiny-plugins/types";

export type InstallPluginType = PluginType & {
    meta: {
        name: string,
        description: string
    },
    install: () => Promise<void>
};
