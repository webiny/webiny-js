import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/feature/api";
import type { TransportSendData, TransportSendResponse } from "~/types.js";
import type { MailerService } from "~/domain/MailerService/abstractions.js";

export interface ISendMail {
    execute<D = any>(
        data: TransportSendData
    ): Promise<Result<TransportSendResponse<D>, MailerService.Error>>;
}

export const SendMail = createAbstraction<ISendMail>("SendMail");

export namespace SendMail {
    export type Interface = ISendMail;
}

// Domain Events
export interface MailBeforeSendPayload {
    data: TransportSendData;
}

export class MailBeforeSendEvent extends DomainEvent<MailBeforeSendPayload> {
    static eventName = "mailer.mail.beforeSend" as const;
}

export interface MailAfterSendPayload<D = any> {
    data: TransportSendData;
    response: TransportSendResponse<D>;
}

export class MailAfterSendEvent<D = any> extends DomainEvent<MailAfterSendPayload<D>> {
    static eventName = "mailer.mail.afterSend" as const;
}

export interface MailSendErrorPayload {
    data: TransportSendData;
    error: Error;
}

export class MailSendErrorEvent extends DomainEvent<MailSendErrorPayload> {
    static eventName = "mailer.mail.sendError" as const;
}
