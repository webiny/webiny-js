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
     * Whether a transport is set up. It does not connect or send, so a transport with wrong
     * credentials still counts. Only for a question that has to be answered before anything is
     * sent; otherwise send, and handle `NoTransportAvailableError`.
     */
    isConfigured(): Promise<boolean>;
}

export const MailerService = createAbstraction<IMailerService>("MailerService");

export namespace MailerService {
    export type Interface = IMailerService;
    export type Return<T = any> = Promise<Result<TransportSendResponse<T>, MailerServiceError>>;
    export type Error = MailerServiceError;
}
