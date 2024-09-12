import { Plugin } from "@webiny/plugins/Plugin";
import { InvokeArgs } from "~/types";

interface HandlerClientPluginCallable<Payload = any, Response = any> {
    (params: InvokeArgs<Payload>): Promise<Response>;
}

export interface HandlerClientPluginParams {
    invoke: HandlerClientPluginCallable;
    canUse?: (params: InvokeArgs) => boolean;
}

export class HandlerClientPlugin extends Plugin {
    public static override type = "handler-client";

    private readonly _invoke: HandlerClientPluginCallable;
    private readonly canUse?: (params: InvokeArgs) => boolean;

    public constructor({ invoke, canUse }: HandlerClientPluginParams) {
        super();
        this._invoke = invoke;
        this.canUse = canUse;
    }

    public canHandle(params: InvokeArgs): boolean {
        if (!this.canUse) {
            return true;
        }
        return this.canUse(params);
    }

    public invoke<Payload = any, Response = any>(params: InvokeArgs<Payload>): Promise<Response> {
        return this._invoke(params);
    }
}
