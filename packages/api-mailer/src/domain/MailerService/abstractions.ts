import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { TransportSendData, TransportSendResponse } from "~/types.js";
import { NoTransportAvailableError, TransportCreateError, TransportSendError } from "./errors.js";

export interface IMailerServiceErrors {
    noTransport: NoTransportAvailableError;
    transportCreate: TransportCreateError;
    transportSend: TransportSendError;
}

type MailerServiceError = IMailerServiceErrors[keyof IMailerServiceErrors];

export interface IMailerService {
    sendMail<T = any>(
        data: TransportSendData
    ): Promise<Result<TransportSendResponse<T>, MailerServiceError>>;

    /**
     * Whether mail can leave this installation: at least one transport is configured. When none is,
     * `sendMail()` fails with `NoTransportAvailableError`.
     */
    canSend(): Promise<boolean>;
}

export const MailerService = createAbstraction<IMailerService>("MailerService");

export namespace MailerService {
    export type Interface = IMailerService;
    export type Return<T = any> = Promise<Result<TransportSendResponse<T>, MailerServiceError>>;
    export type Error = MailerServiceError;
}
