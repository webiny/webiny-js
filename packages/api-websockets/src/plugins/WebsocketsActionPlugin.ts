import { Plugin } from "@webiny/plugins";
import { GenericRecord } from "@webiny/api/types";
import {
    IWebsocketsActionPluginCallable,
    IWebsocketsActionPluginCallableParams,
    WebsocketsActionPluginCallableResponse
} from "./abstrations/IWebsocketsActionPlugin";

export class WebsocketsActionPlugin<T extends GenericRecord = GenericRecord> extends Plugin {
    public static override readonly type: string = "websockets.route.action";

    public readonly action: string;
    private readonly cb: IWebsocketsActionPluginCallable<T>;

    public constructor(action: string, cb: IWebsocketsActionPluginCallable<T>) {
        super();
        this.action = action;
        this.cb = cb;
    }

    public run(
        params: IWebsocketsActionPluginCallableParams
    ): Promise<WebsocketsActionPluginCallableResponse<T>> {
        return this.cb(params);
    }
}

export const createWebsocketsAction = <T extends GenericRecord = GenericRecord>(
    action: string,
    cb: IWebsocketsActionPluginCallable<T>
) => {
    return new WebsocketsActionPlugin<T>(action, cb);
};
