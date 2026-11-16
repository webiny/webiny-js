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
    canUse(settings: TransportSettings | null): boolean;
    createTransport(settings: TransportSettings): Promise<IMailTransport>;
}

export const MailTransportFactory =
    createAbstraction<IMailTransportFactory>("MailTransportFactory");

export namespace MailTransportFactory {
    export type Interface = IMailTransportFactory;
    export type Return = Promise<IMailTransport>;
}

export interface IResolvedMailTransport {
    factory: IMailTransportFactory;
    settings: TransportSettings | null;
}

export interface IMailTransportResolver {
    /**
     * The factory mail goes out through right now: the last registered one whose settings it can
     * use. Null when none can.
     */
    resolve(): Promise<IResolvedMailTransport | null>;
}

export const MailTransportResolver =
    createAbstraction<IMailTransportResolver>("MailTransportResolver");

export namespace MailTransportResolver {
    export type Interface = IMailTransportResolver;
    export type Resolved = IResolvedMailTransport;
}

export interface IDeliveringTransportResolved {
    name: string;
    from: string | undefined;
    replyTo: string | undefined;
}

export interface IDeliveringTransport {
    /**
     * The transport mail goes out through, and the sender its settings name, when that transport
     * actually delivers. Null when mail would go nowhere: no transport can be used, or the one in use
     * is the dummy transport, which reports success without sending.
     */
    resolve(): Promise<IDeliveringTransportResolved | null>;
}

export const DeliveringTransport = createAbstraction<IDeliveringTransport>("DeliveringTransport");

export namespace DeliveringTransport {
    export type Interface = IDeliveringTransport;
    export type Resolved = IDeliveringTransportResolved;
}
