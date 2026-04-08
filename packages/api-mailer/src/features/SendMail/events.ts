import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    MailBeforeSendEventHandler,
    MailAfterSendEventHandler,
    MailSendErrorEventHandler
} from "./abstractions.js";
import type {
    MailBeforeSendPayload,
    MailAfterSendPayload,
    MailSendErrorPayload
} from "./abstractions.js";

export class MailBeforeSendEvent extends DomainEvent<MailBeforeSendPayload> {
    eventType = "mailer.mail.beforeSend" as const;

    getHandlerAbstraction() {
        return MailBeforeSendEventHandler;
    }
}

export class MailAfterSendEvent extends DomainEvent<MailAfterSendPayload> {
    eventType = "mailer.mail.afterSend" as const;

    getHandlerAbstraction() {
        return MailAfterSendEventHandler;
    }
}

export class MailSendErrorEvent extends DomainEvent<MailSendErrorPayload> {
    eventType = "mailer.mail.sendError" as const;

    getHandlerAbstraction() {
        return MailSendErrorEventHandler;
    }
}
