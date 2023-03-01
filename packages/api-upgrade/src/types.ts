import { Plugin } from "@webiny/plugins/types";
import { Context } from "@webiny/api/types";

export interface UpgradePlugin<T extends Context = Context> extends Plugin {
    type: "api-upgrade";
    app: string;
    version: string;
    apply(context: T, data?: Record<string, any>): Promise<void>;
}
