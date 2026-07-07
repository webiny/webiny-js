import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { InvalidCredentialsError } from "~/api/domain/errors.js";

export interface LoginInput {
    email: string;
    password: string;
}

export interface LoginOutput {
    token: string;
    expiresIn: number;
}

export type LoginError = InvalidCredentialsError;

export interface ILoginUseCase {
    execute(input: LoginInput): Promise<Result<LoginOutput, LoginError>>;
}

/** Verifies a username/password pair and mints a signed JWT. */
export const LoginUseCase = createAbstraction<ILoginUseCase>("LoginUseCase");

export namespace LoginUseCase {
    export type Interface = ILoginUseCase;
    export type Input = LoginInput;
    export type Output = LoginOutput;
    export type Error = LoginError;
}
