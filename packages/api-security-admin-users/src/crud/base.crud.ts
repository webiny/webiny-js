import { Plugin } from "@webiny/plugins";
import { AdminUsersContext } from "~/types";

export abstract class Base {
    protected readonly context: AdminUsersContext;

    constructor(context: AdminUsersContext) {
        this.context = context;
    }

    abstract get plugins(): Plugin[];

    protected async executeCallback<
        TCallbackFunction extends (params: any) => void | Promise<void>
    >(callback: string, params: Parameters<TCallbackFunction>[0]) {
        for (const plugin of this.plugins) {
            if (typeof plugin[callback] === "function") {
                await plugin[callback](params);
            }
        }
    }
}
