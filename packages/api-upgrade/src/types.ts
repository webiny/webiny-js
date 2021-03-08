import { Plugin } from "@webiny/plugins/types";
import { ContextInterface } from "@webiny/handler/types";

export interface UpgradePlugin<T extends ContextInterface = ContextInterface> extends Plugin {
    type: "api-upgrade";
    app: string;
    version: string;
    apply(context: T, data?: Record<string, any>): Promise<void>;
}
