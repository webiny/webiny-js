import { createAbstraction } from "@webiny/feature/api";
import type { TransportSendData, TransportSendResponse, TransportSettings } from "~/types.js";

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
    createTransport(settings: TransportSettings): Promise<IMailTransport>;
}

export const MailTransportFactory =
    createAbstraction<IMailTransportFactory>("MailTransportFactory");

export namespace MailTransportFactory {
    export type Interface = IMailTransportFactory;
    export type Return = Promise<IMailTransport>;
}

export interface IActiveTransport {
    name(): string | null;
}

export const ActiveTransport = createAbstraction<IActiveTransport>("ActiveTransport");

export namespace ActiveTransport {
    export type Interface = IActiveTransport;
}
