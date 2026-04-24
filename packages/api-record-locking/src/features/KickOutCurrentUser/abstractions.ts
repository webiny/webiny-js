import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ILockRecord } from "~/domain/LockRecord.js";

/**
 * KickOutCurrentUser Use Case - Sends websocket message to notify locked-out user
 */
export interface IKickOutCurrentUserUseCase {
    execute(record: ILockRecord): Promise<Result<void, UseCaseError>>;
}

export interface IKickOutCurrentUserUseCaseErrors {
    // This use case swallows errors and logs them, so no errors are exposed
}

type UseCaseError = IKickOutCurrentUserUseCaseErrors[keyof IKickOutCurrentUserUseCaseErrors];

export const KickOutCurrentUserUseCase = createAbstraction<IKickOutCurrentUserUseCase>(
    "KickOutCurrentUserUseCase"
);

export namespace KickOutCurrentUserUseCase {
    export type Interface = IKickOutCurrentUserUseCase;
    export type Error = UseCaseError;
}
