import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { TransportSendData, TransportSendResponse } from "~/types.js";
import type { MailerService } from "~/domain/MailerService/abstractions.js";

export interface ISendMail {
    execute(data: TransportSendData): Promise<Result<TransportSendResponse, MailerService.Error>>;
}

export const SendMail = createAbstraction<ISendMail>("SendMail");

export namespace SendMail {
    export type Interface = ISendMail;
}

// Domain Events
export interface MailBeforeSendPayload {
    data: TransportSendData;
}

export interface MailAfterSendPayload {
    data: TransportSendData;
    response: TransportSendResponse;
}

export interface MailSendErrorPayload {
    data: TransportSendData;
    error: Error;
}

// Event Handler Abstractions
export const MailBeforeSendHandler =
    createAbstraction<IEventHandler<DomainEvent<MailBeforeSendPayload>>>("MailBeforeSendHandler");

export namespace MailBeforeSendHandler {
    export type Interface = IEventHandler<DomainEvent<MailBeforeSendPayload>>;
    export type Event = DomainEvent<MailBeforeSendPayload>;
}

export const MailAfterSendHandler =
    createAbstraction<IEventHandler<DomainEvent<MailAfterSendPayload>>>("MailAfterSendHandler");

export namespace MailAfterSendHandler {
    export type Interface = IEventHandler<DomainEvent<MailAfterSendPayload>>;
    export type Event = DomainEvent<MailAfterSendPayload>;
}

export const MailSendErrorHandler =
    createAbstraction<IEventHandler<DomainEvent<MailSendErrorPayload>>>("MailSendErrorHandler");

export namespace MailSendErrorHandler {
    export type Interface = IEventHandler<DomainEvent<MailSendErrorPayload>>;
    export type Event = DomainEvent<MailSendErrorPayload>;
}
