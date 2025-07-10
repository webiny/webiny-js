/**
 * !!!!!!!!!!!!!!
 * !!! DANGER !!!
 * !!!!!!!!!!!!!!
 *
 * Using this plugin can cause slowdowns in your application response times.
 * Also, if you do not return payload from the plugin callback, there will be nothing to send in the response.
 */
import { Plugin } from "@webiny/plugins";
import type { Reply as FastifyReply, Request as FastifyRequest } from "~/types.js";

export interface IOnResponseSendPluginCallable {
    <T = unknown>(request: FastifyRequest, reply: FastifyReply, payload: T): Promise<T>;
}

/**
 * @description Read info in the class file.
 */
export class OnRequestResponseSendPlugin extends Plugin {
    public static override type: string = "handler.onRequestResponseSend";

    private readonly cb: IOnResponseSendPluginCallable;

    public constructor(cb: IOnResponseSendPluginCallable) {
        super();
        this.cb = cb;
    }

    public async exec<T = unknown>(
        request: FastifyRequest,
        reply: FastifyReply,
        payload: T
    ): Promise<unknown> {
        return await this.cb<T>(request, reply, payload);
    }
}

/**
 * @description Read info in the class file.
 */
export const createOnRequestResponseSend = (cb: IOnResponseSendPluginCallable) => {
    return new OnRequestResponseSendPlugin(cb);
};
