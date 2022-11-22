import { Plugin as BasePlugin } from "@webiny/plugins";
import { Transport, MailerContext, TransportSettings } from "~/types";

interface TransportParams {
    settings: TransportSettings | null;
    context: MailerContext;
}

export interface CreateTransportCallable<T> {
    (params: TransportParams): Promise<T>;
}

export class CreateTransportPlugin<T extends Transport = Transport> extends BasePlugin {
    public static override type = "mailer.builder.plugin";

    private readonly cb: CreateTransportCallable<T>;

    public constructor(cb: CreateTransportCallable<T>) {
        super();
        this.cb = cb;
    }

    public async buildMailerTransport(params: TransportParams): Promise<T> {
        return this.cb(params);
    }
}

export const createTransport = <T extends Transport = Transport>(
    cb: CreateTransportCallable<T>
) => {
    return new CreateTransportPlugin<T>(cb);
};
