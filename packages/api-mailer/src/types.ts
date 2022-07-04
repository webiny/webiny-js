import { Context } from "@webiny/handler/types";
import { Topic } from "@webiny/pubsub/types";

export interface MailerContextObjectSendParams {
    data: MailerSenderParams;
}
export interface MailerContextObject {
    onBeforeSend: Topic<OnBeforeMailerSendParams>;
    onAfterSend: Topic<OnAfterMailerSendParams>;
    onError: Topic<OnErrorMailerParams>;
    send: <T>(params: MailerContextObjectSendParams) => Promise<MailerSenderSendResponse<T>>;
}
export interface MailerContext extends Context {
    mailer: MailerContextObject;
}

export interface MailerConfig<T extends MailerSender = MailerSender> {
    sender?: T;
}

export interface OnBeforeMailerSendParams {
    data: MailerSenderParams;
}
export interface OnAfterMailerSendParams {
    data: MailerSenderParams;
}
export interface OnErrorMailerParams {
    error: Error;
    data: MailerSenderParams;
}

/**
 * Interface to implement the actual mail sender.
 */
export interface MailerSenderSendResponse<T = any> {
    result: T | null;
    error: {
        message: string;
        code: string;
        data: {
            [key: string]: any;
        };
    } | null;
}

export interface MailerSenderParams {
    to: string | string[];
    from: string;
    subject: string;
    body: string;
    replyTo?: string;
    cc?: string | string[];
    bcc?: string | string[];
}
export interface MailerSender<T = any> {
    send: (params: MailerSenderParams) => Promise<MailerSenderSendResponse<T>>;
}
