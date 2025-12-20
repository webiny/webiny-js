import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import {
    MailBeforeSendHandler,
    MailAfterSendHandler,
    MailSendErrorHandler
} from "./abstractions.js";
import type {
    MailBeforeSendPayload,
    MailAfterSendPayload,
    MailSendErrorPayload
} from "./abstractions.js";

export class MailBeforeSendEvent extends DomainEvent<MailBeforeSendPayload> {
    eventType = "mailer.mail.beforeSend" as const;

    getHandlerAbstraction() {
        return MailBeforeSendHandler;
    }
}

export class MailAfterSendEvent extends DomainEvent<MailAfterSendPayload> {
    eventType = "mailer.mail.afterSend" as const;

    getHandlerAbstraction() {
        return MailAfterSendHandler;
    }
}

export class MailSendErrorEvent extends DomainEvent<MailSendErrorPayload> {
    eventType = "mailer.mail.sendError" as const;

    getHandlerAbstraction() {
        return MailSendErrorHandler;
    }
}
