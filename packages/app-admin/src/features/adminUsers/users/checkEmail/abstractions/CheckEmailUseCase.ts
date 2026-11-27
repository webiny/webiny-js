import { createAbstraction } from "@webiny/feature/admin";
import type { EmailStatus } from "./CheckEmailGateway.js";

export interface ICheckEmailUseCase {
    execute(email: string): Promise<EmailStatus>;
}

export const CheckEmailUseCase = createAbstraction<ICheckEmailUseCase>("CheckEmailUseCase");

export namespace CheckEmailUseCase {
    export type Interface = ICheckEmailUseCase;
    export type Status = EmailStatus;
}
