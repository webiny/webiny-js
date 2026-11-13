import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { SendMailUseCase } from "~/features/SendMail/abstractions.js";
import { TestMailNotAuthorized, TestMailNotConfigured } from "~/domain/errors.js";

export interface SendTestMailInput {
    to: string;
}

export interface ISendTestMailErrors {
    notAuthorized: TestMailNotAuthorized;
    notConfigured: TestMailNotConfigured;
    sendMail: SendMailUseCase.Error;
}

type SendTestMailError = ISendTestMailErrors[keyof ISendTestMailErrors];

export interface ISendTestMailUseCase {
    execute(input: SendTestMailInput): Promise<Result<void, SendTestMailError>>;
}

/**
 * Sends one message through the saved SMTP settings so an operator can tell settings that deliver
 * from settings that only look configured. The SMTP server's own error comes back to the caller.
 */
export const SendTestMailUseCase = createAbstraction<ISendTestMailUseCase>("SendTestMailUseCase");

export namespace SendTestMailUseCase {
    export type Interface = ISendTestMailUseCase;
    export type Input = SendTestMailInput;
    export type Return = Promise<Result<void, SendTestMailError>>;
    export type Error = SendTestMailError;
}
