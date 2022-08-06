import { Plugin } from "@webiny/plugins/Plugin";
import { InvokeArgs } from "~/types";

interface HandlerClientPluginCallable<Payload = Record<string, any>, Response = any> {
    (params: InvokeArgs<Payload>): Promise<Response>;
}

export class HandlerClientPlugin extends Plugin {
    public static override type = "handler-client";

    private readonly cb: HandlerClientPluginCallable;

    public constructor(cb: HandlerClientPluginCallable) {
        super();
        this.cb = cb;
    }

    public invoke<Payload = Record<string, any>, Response = any>(
        params: InvokeArgs<Payload>
    ): Promise<Response> {
        return this.cb(params);
    }
}
