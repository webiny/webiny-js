import { Context } from "@webiny/handler/types";

export interface MailerContextObjectSendParams {
    data: MailerSenderParams;
}
export interface MailerContextObject {
    send: <T>(params: MailerContextObjectSendParams) => Promise<MailerSenderSendResponse<T>>;
}
export interface MailerContext extends Context {
    mailer: MailerContextObject;
}

export interface MailerConfig<T extends MailerSender = MailerSender> {
    sender?: T;
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
