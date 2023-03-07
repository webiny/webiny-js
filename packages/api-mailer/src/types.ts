import { CmsContext } from "@webiny/api-headless-cms/types";
import { Topic } from "@webiny/pubsub/types";

export interface MailerTransporterContext<T extends Transport = Transport> {
    onTransportBeforeSend: Topic<OnTransportBeforeSendParams>;
    onTransportAfterSend: Topic<OnTransportAfterSendParams>;
    onTransportError: Topic<OnTransportErrorParams>;
    getTransport: () => Promise<T | null>;
    sendMail: <D>(data: TransportSendData) => Promise<TransportSendResponse<D>>;
}

export interface MailerSettingsCreateParams {
    input: Partial<TransportSettings>;
}
export interface MailerSettingsUpdateParams {
    input: Partial<TransportSettings>;
    original?: ExtendedTransportSettings | null;
}

export interface MailerSettingsSaveParams {
    input: Partial<TransportSettings>;
}

export interface OnSettingsBeforeGetTopicParams {
    tenant: string;
}

export interface OnSettingsAfterGetTopicParams {
    tenant: string;
    settings: TransportSettings | null;
}

export interface OnSettingsGetErrorTopicParams {
    tenant: string;
    error: Error;
}

export interface OnSettingsBeforeCreateTopicParams {
    settings: TransportSettings;
}

export interface OnSettingsAfterCreateTopicParams {
    settings: TransportSettings;
}

export interface OnSettingsCreateErrorTopicParams {
    settings: TransportSettings;
    error: Error;
}

export interface OnSettingsBeforeUpdateTopicParams {
    settings: TransportSettings;
    original: TransportSettings;
}

export interface OnSettingsAfterUpdateTopicParams {
    original: TransportSettings;
    settings: TransportSettings;
}

export interface OnSettingsUpdateErrorTopicParams {
    original: TransportSettings;
    settings: TransportSettings;
    error: Error;
}

export interface ExtendedTransportSettings extends TransportSettings {
    id: string;
}

export interface MailerSettingsContext {
    getSettings: () => Promise<ExtendedTransportSettings | null>;
    /**
     * Method should not be used outside of mailer
     * @internal
     */
    createSettings: (params: MailerSettingsCreateParams) => Promise<TransportSettings>;
    /**
     * Method should not be used outside of mailer
     * @internal
     */
    updateSettings: (params: MailerSettingsUpdateParams) => Promise<TransportSettings>;
    /**
     * Use to store the settings data.
     */
    saveSettings: (params: MailerSettingsSaveParams) => Promise<TransportSettings>;
    /**
     * Lifecycle events
     */
    onSettingsBeforeGet: Topic<OnSettingsBeforeGetTopicParams>;
    onSettingsAfterGet: Topic<OnSettingsAfterGetTopicParams>;
    onSettingsGetError: Topic<OnSettingsGetErrorTopicParams>;
    onSettingsBeforeCreate: Topic<OnSettingsBeforeCreateTopicParams>;
    onSettingsAfterCreate: Topic<OnSettingsAfterCreateTopicParams>;
    onSettingsCreateError: Topic<OnSettingsCreateErrorTopicParams>;
    onSettingsBeforeUpdate: Topic<OnSettingsBeforeUpdateTopicParams>;
    onSettingsAfterUpdate: Topic<OnSettingsAfterUpdateTopicParams>;
    onSettingsUpdateError: Topic<OnSettingsUpdateErrorTopicParams>;
}

export interface MailerContextObject<T extends Transport = Transport>
    extends MailerTransporterContext<T>,
        MailerSettingsContext {}
export interface MailerContext extends CmsContext {
    mailer: MailerContextObject;
}

export interface OnTransportBeforeSendParams {
    data: TransportSendData;
    transport: Transport;
}
export interface OnTransportAfterSendParams {
    data: TransportSendData;
    transport: Transport;
}
export interface OnTransportErrorParams {
    error: Error;
    data: TransportSendData;
    transport: Transport;
}

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
export interface Transport<T = any> {
    name: string;
    send: (params: TransportSendData) => Promise<TransportSendResponse<T>>;
}

export interface TransportSettings {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
    replyTo?: string;
}
