import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { DomainEvent, IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { TransportSendData, TransportSendResponse } from "~/types.js";
import type { MailerService } from "~/domain/MailerService/abstractions.js";
import { MailValidationError } from "~/domain/errors.js";

export interface ISendMailErrors {
    validation: MailValidationError;
    mailService: MailerService.Error;
}

type SendMailErrors = ISendMailErrors[keyof ISendMailErrors];

export interface ISendMailUseCase {
    execute(data: TransportSendData): Promise<Result<TransportSendResponse, SendMailErrors>>;
}

export const SendMailUseCase = createAbstraction<ISendMailUseCase>("SendMail");

export namespace SendMailUseCase {
    export type Interface = ISendMailUseCase;
    export type Error = SendMailErrors;
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
