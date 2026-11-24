import { createAbstraction } from "@webiny/feature/api";
import type { TransportSendData, TransportSendResponse } from "~/types.js";

export interface IMailTransport {
    name: string;
    send(params: TransportSendData): Promise<TransportSendResponse>;
}

export const MailTransport = createAbstraction<IMailTransport>("MailTransport");

export namespace MailTransport {
    export type Interface = IMailTransport;
    export type SendParams = TransportSendData;
}

export interface IMailTransportFactory {
    name: string;
    /**
     * Reads the transport's own configuration (stored settings, environment variables, whatever the
     * transport uses) and builds it. Null when the transport is not configured.
     */
    createTransport(): Promise<IMailTransport | null>;
}

export const MailTransportFactory =
    createAbstraction<IMailTransportFactory>("MailTransportFactory");

export namespace MailTransportFactory {
    export type Interface = IMailTransportFactory;
    export type Return = Promise<IMailTransport | null>;
}
