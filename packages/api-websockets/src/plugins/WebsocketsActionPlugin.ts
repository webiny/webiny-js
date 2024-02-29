import { Plugin } from "@webiny/plugins";
import { Context } from "~/types";
import { GenericRecord } from "@webiny/api/types";

export interface IWebsocketsActionPluginCallableParamsSend {
    toConnection<T extends GenericRecord = GenericRecord>(
        connectionId: string,
        data: T
    ): Promise<void>;
    toTenant<T extends GenericRecord = GenericRecord>(tenant: string, data: T): Promise<void>;
    toTenantAndLocale<T extends GenericRecord = GenericRecord>(
        tenant: string,
        locale: string,
        data: T
    ): Promise<void>;
    toIdentity<T extends GenericRecord = GenericRecord>(identity: string, data: T): Promise<void>;
}

export interface IWebsocketsActionPluginCallableParamsRespondError<
    T extends GenericRecord = GenericRecord
> {
    message: string;
    code: string;
    data: T;
}

export interface IWebsocketsActionPluginCallableParamsRespondOkResponse<
    T extends GenericRecord = GenericRecord
> {
    data: T;
    error?: never;
}

export interface IWebsocketsActionPluginCallableParamsRespondErrorResponse<
    T extends GenericRecord = GenericRecord
> {
    error: IWebsocketsActionPluginCallableParamsRespondError<T>;
    data?: never;
}

export interface IWebsocketsActionPluginCallableParamsRespond {
    ok<T extends GenericRecord = GenericRecord>(
        data: T
    ): Promise<IWebsocketsActionPluginCallableParamsRespondOkResponse<T>>;
    error<T extends GenericRecord = GenericRecord>(
        error: IWebsocketsActionPluginCallableParamsRespondError<T>
    ): Promise<IWebsocketsActionPluginCallableParamsRespondErrorResponse<T>>;
}

export interface IWebsocketsActionPluginCallableParams<C extends Context = Context> {
    context: C;
    next(): Promise<void>;
    send: IWebsocketsActionPluginCallableParamsSend;
    respond: IWebsocketsActionPluginCallableParamsRespond;
}

export interface IWebsocketsActionPluginCallable {
    (params: IWebsocketsActionPluginCallableParams): Promise<void>;
}

export class WebsocketsActionPlugin extends Plugin {
    public static override readonly type: string = "websockets.route.action";

    public readonly action: string;
    private readonly cb: IWebsocketsActionPluginCallable;

    public constructor(action: string, cb: IWebsocketsActionPluginCallable) {
        super();
        this.action = action;
        this.cb = cb;
    }
}
