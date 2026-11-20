import { createAbstraction } from "@webiny/feature/api";

export interface IIsMailerConfiguredUseCase {
    execute(): Promise<boolean>;
}

/**
 * Whether a mail transport is set up. It does not connect or send, so a transport with wrong
 * credentials still counts.
 *
 * Only for a question that has to be answered before anything is sent, like the password reset
 * request, which must answer every address the same way. Otherwise send through `SendMailUseCase`
 * and handle `NoTransportAvailableError`.
 *
 * No permission check: the password reset request is anonymous.
 */
export const IsMailerConfiguredUseCase = createAbstraction<IIsMailerConfiguredUseCase>(
    "IsMailerConfiguredUseCase"
);

export namespace IsMailerConfiguredUseCase {
    export type Interface = IIsMailerConfiguredUseCase;
    export type Return = Promise<boolean>;
}
