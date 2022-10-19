import { Context } from "@webiny/api/types";
import { Topic } from "@webiny/pubsub/types";

export interface MailerContextObject<T extends Mailer = Mailer> {
    onMailerBeforeInit: Topic<OnMailerBeforeInitParams>;
    onMailerInitError: Topic<OnMailerInitErrorParams>;
    onMailerAfterInit: Topic<OnMailerAfterInitParams>;
    onMailerBeforeSend: Topic<OnMailerBeforeSendParams>;
    onMailerAfterSend: Topic<OnMailerAfterSendParams>;
    onMailerError: Topic<OnMailerErrorParams>;
    isAvailable: () => boolean;
    setMailer: (mailer: T) => void;
    getMailer: () => T;
    send: <D>(data: MailerSendData) => Promise<MailerSendResponse<D>>;
}
export interface MailerContext extends Context {
    mailer: MailerContextObject;
}

export interface MailerConfig<T extends Mailer = Mailer> {
    mailer: T;
    [key: string]: any;
}

export interface OnMailerBeforeInitParams {
    config: any;
}

export interface OnMailerInitErrorParams {
    error: Error;
    /**
     * If we change silent to true in the subscriber function, we will not throw the error.
     */
    silent?: boolean;
}

export interface OnMailerAfterInitParams {
    config: any;
}

export interface OnMailerBeforeSendParams {
    data: MailerSendData;
}
export interface OnMailerAfterSendParams {
    data: MailerSendData;
}
export interface OnMailerErrorParams {
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
        data?: {
            [key: string]: any;
        };
    } | null;
}

interface MailerSendToData {
    to: string[];
}
interface MailerSendCcData {
    cc: string[];
}
interface MailerSendBccData {
    bcc: string[];
}

interface BaseMailerSendData {
    to?: string[];
    cc?: string[];
    bcc?: string[];
    from?: string;
    subject: string;
    text: string;
    html?: string;
    replyTo?: string;
}

export type MailerSendData = BaseMailerSendData &
    (MailerSendToData | MailerSendBccData | MailerSendCcData);
export interface Mailer<T = any> {
    name: string;
    send: (params: MailerSendData) => Promise<MailerSendResponse<T>>;
}
