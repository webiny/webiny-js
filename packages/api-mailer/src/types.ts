/**
 * Interface to implement the actual mailer.
 */
export interface TransportSendResponse<T = any> {
    result: T | null;
    error: {
        message: string;
        code: string;
        data?: {
            [key: string]: any;
        };
    } | null;
}

interface TransportSendToData {
    to: string[];
}
interface TransportSendCcData {
    cc: string[];
}
interface TransportSendBccData {
    bcc: string[];
}

interface BaseTransportSendData {
    to?: string[];
    cc?: string[];
    bcc?: string[];
    from?: string;
    subject: string;
    text?: string;
    html?: string;
    replyTo?: string;
}

export type TransportSendData = BaseTransportSendData &
    (TransportSendToData | TransportSendBccData | TransportSendCcData);

export interface TransportSettings {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
    replyTo?: string;
}
