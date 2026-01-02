import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { TransportSendData, TransportSendResponse } from "~/types.js";
import {
    NoTransportAvailableError,
    NoSettingsConfiguredError,
    TransportSendError
} from "./errors.js";

export interface IMailerServiceErrors {
    noTransport: NoTransportAvailableError;
    noSettings: NoSettingsConfiguredError;
    transportSend: TransportSendError;
}

type MailerServiceError = IMailerServiceErrors[keyof IMailerServiceErrors];

export interface IMailerService {
    sendMail<T = any>(
        data: TransportSendData
    ): Promise<Result<TransportSendResponse<T>, MailerServiceError>>;
}

export const MailerService = createAbstraction<IMailerService>("MailerService");

export namespace MailerService {
    export type Interface = IMailerService;
    export type Return<T = any> = Promise<Result<TransportSendResponse<T>, MailerServiceError>>;
    export type Error = MailerServiceError;
}
