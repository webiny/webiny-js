import { Plugin } from "@webiny/plugins";
import { Context } from "~/types";
import { GenericRecord } from "@webiny/api/types";

export interface ISocketsActionPluginCallableParamsSend {
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

export interface ISocketsActionPluginCallableParamsRespondError<
    T extends GenericRecord = GenericRecord
> {
    message: string;
    code: string;
    data: T;
}

export interface ISocketsActionPluginCallableParamsRespondOkResponse<
    T extends GenericRecord = GenericRecord
> {
    data: T;
    error?: never;
}

export interface ISocketsActionPluginCallableParamsRespondErrorResponse<
    T extends GenericRecord = GenericRecord
> {
    error: ISocketsActionPluginCallableParamsRespondError<T>;
    data?: never;
}

export interface ISocketsActionPluginCallableParamsRespond {
    ok<T extends GenericRecord = GenericRecord>(
        data: T
    ): Promise<ISocketsActionPluginCallableParamsRespondOkResponse<T>>;
    error<T extends GenericRecord = GenericRecord>(
        error: ISocketsActionPluginCallableParamsRespondError<T>
    ): Promise<ISocketsActionPluginCallableParamsRespondErrorResponse<T>>;
}

export interface ISocketsActionPluginCallableParams<C extends Context = Context> {
    context: C;
    next(): Promise<void>;
    send: ISocketsActionPluginCallableParamsSend;
    respond: ISocketsActionPluginCallableParamsRespond;
}

export interface ISocketsActionPluginCallable {
    (params: ISocketsActionPluginCallableParams): Promise<void>;
}

export class SocketsActionPlugin extends Plugin {
    public static override readonly type: string = "sockets.route.action";

    public readonly action: string;
    private readonly cb: ISocketsActionPluginCallable;

    public constructor(action: string, cb: ISocketsActionPluginCallable) {
        super();
        this.action = action;
        this.cb = cb;
    }
}
