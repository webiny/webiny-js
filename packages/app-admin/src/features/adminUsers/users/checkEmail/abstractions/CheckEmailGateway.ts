import { createAbstraction } from "@webiny/feature/admin";

/**
 * - `AVAILABLE`: a new user can be created with this email.
 * - `EXISTS_HERE`: the current tenant already has a user with this email.
 * - `EXISTS_ELSEWHERE`: the email has an account in another tenant, which can be linked here.
 */
export type EmailStatus = "AVAILABLE" | "EXISTS_HERE" | "EXISTS_ELSEWHERE";

export interface ICheckEmailGateway {
    execute(email: string): Promise<EmailStatus>;
}

export const CheckEmailGateway = createAbstraction<ICheckEmailGateway>("CheckEmailGateway");

export namespace CheckEmailGateway {
    export type Interface = ICheckEmailGateway;
    export type Status = EmailStatus;
}
