import { Context } from "@webiny/handler/types";
import { Topic } from "@webiny/pubsub/types";

export interface MailerContextObjectSendParams {
    data: MailerSendData;
}

export type MailerSetterParams = Mailer | (() => Promise<Mailer>);

export interface MailerSetter {
    (mailer: MailerSetterParams): void;
}

export interface MailerContextObject {
    onBeforeSend: Topic<OnBeforeMailerSendParams>;
    onAfterSend: Topic<OnAfterMailerSendParams>;
    onError: Topic<OnErrorMailerParams>;
    setMailer: MailerSetter;
    getMailer: <T extends Mailer = Mailer>() => Promise<T>;
    send: <T>(params: MailerContextObjectSendParams) => Promise<MailerSendResponse<T>>;
}
export interface MailerContext extends Context {
    mailer: MailerContextObject;
}

export interface MailerConfig<T extends Mailer = Mailer> {
    mailer?: T;
}

export interface OnBeforeMailerSendParams {
    data: MailerSendData;
}
export interface OnAfterMailerSendParams {
    data: MailerSendData;
}
export interface OnErrorMailerParams {
    error: Error;
    data: MailerSendData;
}

/**
 * Interface to implement the actual mailer.
 */
export interface MailerSendResponse<T = any> {
    result: T | null;
    error: {
        message: string;
        code: string;
        data: {
            [key: string]: any;
        };
    } | null;
}

export interface MailerSendData {
    to: string[];
    from: string;
    subject: string;
    text: string;
    html?: string;
    replyTo?: string;
    cc?: string[];
    bcc?: string[];
}
export interface Mailer<T = any> {
    send: (params: MailerSendData) => Promise<MailerSendResponse<T>>;
}
